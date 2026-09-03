import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReviewRow } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { batch_id, client_id, rows } = body as {
      batch_id: string
      client_id: string
      rows: ReviewRow[]
    }

    if (!batch_id || !client_id || !rows?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: batch, error: batchError } = await supabase
      .from('pdf_import_batches')
      .select('id, status')
      .eq('id', batch_id)
      .eq('user_id', user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Import batch not found' }, { status: 404 })
    }

    if (batch.status === 'confirmed') {
      return NextResponse.json(
        { error: 'This import batch has already been confirmed' },
        { status: 409 }
      )
    }

    const selectedRows = rows.filter(r => r.selected)

    if (selectedRows.length === 0) {
      await supabase
        .from('pdf_import_batches')
        .update({ status: 'discarded' })
        .eq('id', batch_id)

      return NextResponse.json({ created: 0, discarded: true })
    }

    const tasksToInsert = selectedRows.map(row => ({
      user_id: user.id,
      client_id,
      work_type_id: row.work_type_id,
      title: row.title,
      description: row.description || '',
      platform: row.platform || '',
      deadline: row.deadline,
      status: 'planned' as const,
      is_billable: row.is_billable,
      billing_quantity: 1,
      source: 'pdf_import' as const,
      import_batch_id: batch_id,
      notes: row.notes || '',
    }))

    const { data: createdTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select('id')

    if (insertError) {
      console.error('Task insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create tasks' },
        { status: 500 }
      )
    }

    await supabase
      .from('pdf_import_batches')
      .update({
        status: 'confirmed',
        task_count_created: createdTasks?.length ?? 0,
      })
      .eq('id', batch_id)

    await supabase.from('activity_log').insert({
      user_id: user.id,
      entity_type: 'task',
      entity_id: batch_id,
      action: 'pdf_import_confirmed',
      new_value: {
        batch_id,
        client_id,
        tasks_created: createdTasks?.length ?? 0,
      },
    })

    return NextResponse.json({
      created: createdTasks?.length ?? 0,
      batch_id,
    })

  } catch (error) {
    console.error('Confirm import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Confirmation failed' },
      { status: 500 }
    )
  }
}
