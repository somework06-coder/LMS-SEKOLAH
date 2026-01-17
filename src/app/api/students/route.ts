import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSession, hashPassword } from '@/lib/auth'

// GET all students
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

        const { searchParams } = new URL(request.url)
        const class_id = searchParams.get('class_id')

        let query = supabase
            .from('students')
            .select(`
        *,
        user:users(id, username, full_name, role),
        class:classes(id, name)
      `)
            .order('created_at', { ascending: false })

        if (class_id) {
            query = query.eq('class_id', class_id)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching students:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST new student
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const authUser = await validateSession(token)
        if (!authUser || authUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { username, password, full_name, nis, class_id, gender } = await request.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Username dan password harus diisi' }, { status: 400 })
        }

        // Check if username exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single()

        if (existingUser) {
            return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
        }

        // Hash password
        const password_hash = await hashPassword(password)

        // Create user
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
                username,
                password_hash,
                full_name,
                role: 'SISWA'
            })
            .select()
            .single()

        if (userError) throw userError

        // Create student record
        const { data: student, error: studentError } = await supabase
            .from('students')
            .insert({
                user_id: newUser.id,
                nis,
                class_id,
                gender
            })
            .select(`
        *,
        user:users(id, username, full_name, role),
        class:classes(id, name)
      `)
            .single()

        if (studentError) {
            // Rollback user creation
            await supabase.from('users').delete().eq('id', newUser.id)
            throw studentError
        }

        return NextResponse.json(student)
    } catch (error) {
        console.error('Error creating student:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
