import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

// GET all assignments
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const teachingAssignmentId = request.nextUrl.searchParams.get('teaching_assignment_id')

        let query = supabase
            .from('assignments')
            .select(`
        *,
        teaching_assignment:teaching_assignments(
          id,
          teacher:teachers(id, user:users(full_name)),
          subject:subjects(name),
          class:classes(name)
        )
      `)
            .order('created_at', { ascending: false })

        if (teachingAssignmentId) {
            query = query.eq('teaching_assignment_id', teachingAssignmentId)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching assignments:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST new assignment
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

        const { teaching_assignment_id, title, description, type, due_date } = await request.json()

        if (!teaching_assignment_id || !title || !type) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('assignments')
            .insert({ teaching_assignment_id, title, description, type, due_date })
            .select()
            .single()

        if (error) throw error

        // Send notifications to all students in the class
        try {
            // Get the teaching assignment to find the class
            const { data: ta } = await supabase
                .from('teaching_assignments')
                .select('class_id, subject:subjects(name)')
                .eq('id', teaching_assignment_id)
                .single()

            if (ta?.class_id) {
                // Get all students in this class
                const { data: students } = await supabase
                    .from('students')
                    .select('user_id')
                    .eq('class_id', ta.class_id)

                if (students && students.length > 0) {
                    const userIds = students.map(s => s.user_id)
                    const notifType = type === 'TUGAS' ? 'TUGAS_BARU' : 'TUGAS_BARU'
                    const subjectName = (ta.subject as any)?.name || ''

                    await supabase.from('notifications').insert(
                        userIds.map(uid => ({
                            user_id: uid,
                            type: notifType,
                            title: `${type === 'TUGAS' ? 'Tugas' : 'Ulangan'} Baru: ${title}`,
                            message: `${subjectName}${due_date ? ` - Deadline: ${new Date(due_date).toLocaleDateString('id-ID')}` : ''}`,
                            link: '/dashboard/siswa/tugas'
                        }))
                    )
                }
            }
        } catch (notifError) {
            console.error('Error sending notifications:', notifError)
            // Don't fail the request if notification fails
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating assignment:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
