import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

// POST grade a submission (for teachers)
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

        const { submission_id, score, feedback } = await request.json()

        if (!submission_id || score === undefined) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
        }

        // Check if grade exists
        const { data: existing } = await supabase
            .from('grades')
            .select('id')
            .eq('submission_id', submission_id)
            .single()

        let gradeData

        if (existing) {
            // Update existing grade
            const { data, error } = await supabase
                .from('grades')
                .update({ score, feedback, graded_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select()
                .single()

            if (error) throw error
            gradeData = data
        } else {
            // Create new grade
            const { data, error } = await supabase
                .from('grades')
                .insert({ submission_id, score, feedback })
                .select()
                .single()

            if (error) throw error
            gradeData = data
        }

        // Send notification to student
        try {
            const { data: submission } = await supabase
                .from('submissions')
                .select(`
                    student:students(user_id),
                    assignment:assignments(title, teaching_assignment:teaching_assignments(subject:subjects(name)))
                `)
                .eq('id', submission_id)
                .single()

            const studentData = submission?.student as any
            if (studentData?.user_id) {
                const assignmentTitle = (submission?.assignment as any)?.title || 'Tugas'
                const subjectName = (submission?.assignment as any)?.teaching_assignment?.subject?.name || ''

                await supabase.from('notifications').insert({
                    user_id: studentData.user_id,
                    type: 'NILAI_KELUAR',
                    title: `Nilai Keluar: ${assignmentTitle}`,
                    message: `${subjectName} - Nilai: ${score}`,
                    link: '/dashboard/siswa/nilai'
                })
            }
        } catch (notifError) {
            console.error('Error sending grade notification:', notifError)
        }

        return NextResponse.json(gradeData)
    } catch (error) {
        console.error('Error grading submission:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
