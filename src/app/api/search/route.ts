import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SearchResult } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query = request.nextUrl.searchParams.get('q')?.trim()
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = `%${query}%`
    const results: SearchResult[] = []

    const { data: clients } = await supabase
      .from('clients')
      .select('id, business_name, contact_name, status, billing_type')
      .eq('user_id', user.id)
      .or(`business_name.ilike.${searchTerm},contact_name.ilike.${searchTerm}`)
      .limit(5)

    for (const client of clients ?? []) {
      results.push({
        id: client.id,
        type: 'client',
        title: client.business_name,
        subtitle: client.contact_name ? `Contact: ${client.contact_name}` : 'Client',
        url: `/clients/${client.id}`,
        meta: client.status === 'archived' ? 'Archived' : undefined,
      })
    }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, deadline, clients(id, business_name), work_types(id, name)')
      .eq('user_id', user.id)
      .ilike('title', searchTerm)
      .limit(5)

    for (const task of tasks ?? []) {
      const client = task.clients as any
      const workType = task.work_types as any
      results.push({
        id: task.id,
        type: 'task',
        title: task.title,
        subtitle: `${client?.business_name ?? 'Unknown'} · ${workType?.name ?? ''}`,
        url: `/work/${task.id}`,
        meta: task.status,
      })
    }

    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, status, clients(id, business_name)')
      .eq('user_id', user.id)
      .ilike('invoice_number', searchTerm)
      .limit(5)

    for (const invoice of invoices ?? []) {
      const client = invoice.clients as any
      results.push({
        id: invoice.id,
        type: 'invoice',
        title: invoice.invoice_number,
        subtitle: client?.business_name ?? 'Unknown',
        url: `/invoices/${invoice.id}`,
        meta: invoice.status,
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
