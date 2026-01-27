import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSession } from '@/lib/auth'

// Initialize Supabase with Service Role Key for admin privileges
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET all materials
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

        let query = supabaseAdmin
            .from('materials')
            .select(`
        *,
          teaching_assignment:teaching_assignments(
          id,
          teacher:teachers(id, user:users(full_name)),
          subject:subjects(id, name),
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
    } catch (error: any) {
        console.error('Error fetching materials:', error)
        return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 })
    }
}

// POST new material
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

        const { teaching_assignment_id, title, description, type, content_url, content_text } = await request.json()

        if (!teaching_assignment_id || !title || !type) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
        }

        // Use supabaseAdmin to bypass RLS for insert
        const { data, error } = await supabaseAdmin
            .from('materials')
            .insert({ teaching_assignment_id, title, description, type, content_url, content_text })
            .select()
            .single()

        if (error) {
            console.error('Supabase Insert Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }



        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error creating material:', error)
        return NextResponse.json({
            error: error.message || 'Server error',
            details: error.toString()
        }, { status: 500 })
    }
}
