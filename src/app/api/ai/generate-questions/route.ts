import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// POST - Generate questions from material using Gemini
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user || user.role !== 'GURU') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
        }

        const { material, count, type, difficulty } = await request.json()

        if (!material) {
            return NextResponse.json({ error: 'Materi diperlukan' }, { status: 400 })
        }

        const questionCount = count || 5
        const questionType = type || 'MIXED' // MULTIPLE_CHOICE, ESSAY, MIXED
        const difficultyLevel = difficulty || 'MEDIUM' // EASY, MEDIUM, HARD

        let typeInstruction = ''
        if (questionType === 'MULTIPLE_CHOICE') {
            typeInstruction = 'Semua soal harus pilihan ganda dengan 4 opsi (A, B, C, D) dan kunci jawaban.'
        } else if (questionType === 'ESSAY') {
            typeInstruction = 'Semua soal harus berbentuk essay/uraian.'
        } else {
            typeInstruction = 'Buat campuran soal pilihan ganda dan essay.'
        }

        let difficultyInstruction = ''
        if (difficultyLevel === 'EASY') {
            difficultyInstruction = 'Buat soal dengan tingkat kesulitan MUDAH, fokus pada pemahaman dasar.'
        } else if (difficultyLevel === 'HARD') {
            difficultyInstruction = 'Buat soal dengan tingkat kesulitan SULIT, termasuk analisis dan penerapan konsep.'
        } else {
            difficultyInstruction = 'Buat soal dengan tingkat kesulitan SEDANG.'
        }

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Kamu adalah guru profesional. Berdasarkan materi berikut, buatlah ${questionCount} soal kuis/ujian.

${typeInstruction}
${difficultyInstruction}

MATERI:
${material}

PENTING: Balas HANYA dengan JSON valid, tanpa markdown atau teks lain.
Format JSON:
{
  "questions": [
    {
      "question_text": "Teks soal lengkap dan jelas",
      "question_type": "MULTIPLE_CHOICE atau ESSAY",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"] (null jika essay),
      "correct_answer": "A/B/C/D" (null jika essay),
      "difficulty": "EASY/MEDIUM/HARD"
    }
  ]
}

Pastikan soal:
1. Relevan dengan materi
2. Bervariasi dalam topik
3. Jelas dan tidak ambigu
4. Untuk pilihan ganda, pengecoh harus masuk akal`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                    }
                })
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Gemini API error:', errorText)
            return NextResponse.json({ error: 'Gemini API error' }, { status: 500 })
        }

        const result = await response.json()
        const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text

        if (!textContent) {
            return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 })
        }

        // Parse JSON from response
        let jsonStr = textContent
        if (jsonStr.includes('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        } else if (jsonStr.includes('```')) {
            jsonStr = jsonStr.replace(/```\n?/g, '')
        }

        try {
            const parsed = JSON.parse(jsonStr.trim())
            return NextResponse.json(parsed)
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Raw:', textContent)
            return NextResponse.json({
                error: 'Failed to parse response',
                raw: textContent
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Error generating questions:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
