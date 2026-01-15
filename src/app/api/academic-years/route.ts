import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

// GET all academic years
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data, error } = await supabase
            .from('academic_years')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching academic years:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST new academic year
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

        const { name, is_active } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Nama tahun ajaran harus diisi' }, { status: 400 })
        }

        // If setting as active, deactivate others first
        if (is_active) {
            await supabase
                .from('academic_years')
                .update({ is_active: false })
                .neq('id', '00000000-0000-0000-0000-000000000000')
        }

        const { data, error } = await supabase
            .from('academic_years')
            .insert({ name, is_active: is_active || false })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating academic year:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
