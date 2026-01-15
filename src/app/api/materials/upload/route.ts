import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSession } from '@/lib/auth'

// Initialize Supabase with Service Role Key for admin privileges (bypassing RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback if no service key, but should be service key
)

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const token = request.cookies.get('session_token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user || user.role !== 'GURU') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabaseAdmin.storage
            .from('materials')
            .upload(filePath, file, {
                contentType: 'application/pdf',
                upsert: false
            })

        if (uploadError) {
            console.error('Upload Error:', uploadError)
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('materials')
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })

    } catch (error) {
        console.error('Server Upload Error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
