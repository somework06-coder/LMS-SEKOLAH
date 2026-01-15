import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// POST - Extract questions from image using Gemini Vision
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

        const formData = await request.formData()
        const image = formData.get('image') as File

        if (!image) {
            return NextResponse.json({ error: 'Image diperlukan' }, { status: 400 })
        }

        // Convert image to base64
        const bytes = await image.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const mimeType = image.type || 'image/jpeg'

        // Call Gemini Vision API
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
                                    text: `Analisis gambar soal ujian/kuis ini dan ekstrak semua soal yang ada.

Untuk setiap soal, tentukan:
1. Teks soal lengkap
2. Tipe soal: "MULTIPLE_CHOICE" jika ada pilihan A/B/C/D, atau "ESSAY" jika tidak
3. Jika pilihan ganda, sertakan opsi-opsinya sebagai array
4. Jika ada kunci jawaban yang terlihat, sertakan juga

PENTING: Balas HANYA dengan JSON valid, tanpa markdown atau teks lain.
Format JSON:
{
  "questions": [
    {
      "question_text": "Teks soal lengkap",
      "question_type": "MULTIPLE_CHOICE atau ESSAY",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"] atau null,
      "correct_answer": "A/B/C/D" atau null
    }
  ]
}`
                                },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
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

        // Parse JSON from response (handle markdown code blocks)
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
        console.error('Error in OCR:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
