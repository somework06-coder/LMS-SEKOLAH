import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

// GET all classes
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

        const { data, error } = await supabase
            .from('classes')
            .select(`
        *,
        academic_year:academic_years(*)
      `)
            .order('name')

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching classes:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST new class
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, academic_year_id } = await request.json()

        if (!name || !academic_year_id) {
            return NextResponse.json({ error: 'Nama kelas dan tahun ajaran harus diisi' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('classes')
            .insert({ name, academic_year_id })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating class:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
