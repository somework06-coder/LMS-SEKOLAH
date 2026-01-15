import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSession } from '@/lib/auth'

// GET notifications for current user
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

        const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true'
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (unreadOnly) {
            query = query.eq('is_read', false)
        }

        const { data, error } = await query

        if (error) throw error

        // Get unread count
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        return NextResponse.json({
            notifications: data || [],
            unreadCount: count || 0
        })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST create notification (for internal use / triggers)
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { user_ids, type, title, message, link } = body

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return NextResponse.json({ error: 'user_ids required' }, { status: 400 })
        }

        if (!type || !title) {
            return NextResponse.json({ error: 'type and title required' }, { status: 400 })
        }

        // Create notifications for all target users
        const notifications = user_ids.map((uid: string) => ({
            user_id: uid,
            type,
            title,
            message: message || null,
            link: link || null
        }))

        const { data, error } = await supabase
            .from('notifications')
            .insert(notifications)
            .select()

        if (error) throw error

        return NextResponse.json({ success: true, count: data?.length || 0 })
    } catch (error) {
        console.error('Error creating notifications:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PUT mark as read
export async function PUT(request: NextRequest) {
    try {
        const token = request.cookies.get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await validateSession(token)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { notification_id, mark_all } = body

        if (mark_all) {
            // Mark all as read
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false)

            if (error) throw error

            return NextResponse.json({ success: true })
        }

        if (!notification_id) {
            return NextResponse.json({ error: 'notification_id required' }, { status: 400 })
        }

        // Mark single notification as read
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notification_id)
            .eq('user_id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating notification:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
