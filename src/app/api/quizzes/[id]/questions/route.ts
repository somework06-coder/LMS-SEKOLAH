import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

// GET questions for a quiz
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', id)
            .order('order_index')

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching questions:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST add question to quiz
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user || user.role !== 'GURU') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Handle bulk insert
        if (Array.isArray(body)) {
            const questions = body.map((q: any, idx: number) => ({
                quiz_id: id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options || null,
                correct_answer: q.correct_answer || null,
                points: q.points || 10,
                order_index: q.order_index ?? idx
            }))

            const { data, error } = await supabase
                .from('quiz_questions')
                .insert(questions)
                .select()

            if (error) throw error

            return NextResponse.json(data)
        }

        // Single insert
        const { question_text, question_type, options, correct_answer, points, order_index } = body

        const { data, error } = await supabase
            .from('quiz_questions')
            .insert({
                quiz_id: id,
                question_text,
                question_type,
                options: options || null,
                correct_answer: correct_answer || null,
                points: points || 10,
                order_index: order_index || 0
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error adding question:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE all questions (for replacing)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user || user.role !== 'GURU') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { error } = await supabase
            .from('quiz_questions')
            .delete()
            .eq('quiz_id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting questions:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
