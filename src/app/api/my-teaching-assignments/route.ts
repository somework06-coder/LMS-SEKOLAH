import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

// GET teaching assignments for current logged-in user
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

        console.log('[My TA] User ID:', user.id)

        // Get teacher record for current user
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (teacherError) {
            console.error('[My TA] Teacher query error:', teacherError)
            return NextResponse.json({
                error: 'Teacher query failed',
                details: teacherError.message
            }, { status: 500 })
        }

        if (!teacher) {
            console.log('[My TA] No teacher record found')
            return NextResponse.json([])
        }

        console.log('[My TA] Teacher ID:', teacher.id)

        // Get teaching assignments for this teacher
        const { data: assignments, error: assignmentsError } = await supabase
            .from('teaching_assignments')
            .select(`
                id,
                teacher_id,
                subject:subjects(id, name),
                class:classes(id, name),
                academic_year:academic_years(id, name)
            `)
            .eq('teacher_id', teacher.id)

        if (assignmentsError) {
            console.error('[My TA] Assignments query error:', assignmentsError)
            return NextResponse.json({
                error: 'Assignments query failed',
                details: assignmentsError.message,
                hint: assignmentsError.hint,
                code: assignmentsError.code
            }, { status: 500 })
        }

        console.log('[My TA] Found assignments:', assignments?.length || 0)

        return NextResponse.json(assignments || [])
    } catch (error: any) {
        console.error('[My TA] Unexpected error:', error)
        return NextResponse.json({
            error: 'Server error',
            message: error?.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        }, { status: 500 })
    }
}
