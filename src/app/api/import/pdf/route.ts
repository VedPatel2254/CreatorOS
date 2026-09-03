import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPdfContent } from '@/lib/server/pdf-extractor'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const clientId = formData.get('client_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size must be under 10MB' },
        { status: 400 }
      )
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, business_name')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: workTypes } = await supabase
      .from('work_types')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const storagePath = `${user.id}/${clientId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('imports')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
    }

    const extractedRaw = await extractPdfContent(buffer, workTypes ?? [])

    const isImageBased = extractedRaw.metadata.extraction_method === 'ocr_unavailable'
    const confidence = isImageBased
      ? 'failed'
      : extractedRaw.rows.length === 0
        ? 'failed'
        : extractedRaw.rows.every(r => r.confidence === 'high')
          ? 'high'
          : extractedRaw.rows.some(r => r.confidence === 'high')
            ? 'medium'
            : 'low'

    const { data: batch, error: batchError } = await supabase
      .from('pdf_import_batches')
      .insert({
        user_id: user.id,
        client_id: clientId,
        original_filename: file.name,
        storage_path: uploadError ? null : storagePath,
        extracted_raw: extractedRaw,
        extraction_method: extractedRaw.metadata.extraction_method,
        extraction_confidence: confidence,
        status: 'pending_review',
        task_count_extracted: extractedRaw.rows.length,
        task_count_created: 0,
        extraction_warnings: isImageBased
          ? ['PDF appears to be image-based. Text extraction is not possible.']
          : extractedRaw.rows.flatMap(r => r.warnings).filter(Boolean),
      })
      .select()
      .single()

    if (batchError) {
      console.error('Batch creation error:', batchError)
      return NextResponse.json(
        { error: 'Failed to save import batch' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      batch_id: batch.id,
      extracted_rows: extractedRaw.rows,
      metadata: extractedRaw.metadata,
      is_image_based: isImageBased,
      confidence,
      warnings: batch.extraction_warnings,
    })

  } catch (error) {
    console.error('PDF import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}
