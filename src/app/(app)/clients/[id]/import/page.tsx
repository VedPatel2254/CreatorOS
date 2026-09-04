'use client'

import { use, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useClient } from '@/hooks/useClients'
import { UploadStep } from '@/components/import/UploadStep'
import { ReviewStep } from '@/components/import/ReviewStep'
import { DoneStep } from '@/components/import/DoneStep'
import { ExtractedRow, ReviewRow } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

type WizardStep = 'upload' | 'processing' | 'review' | 'confirming' | 'done' | 'error'

export default function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: client, isLoading: clientLoading } = useClient(id)

  const [step, setStep] = useState<WizardStep>('upload')
  const [batchId, setBatchId] = useState<string | null>(null)
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([])
  const [isImageBased, setIsImageBased] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ created: number } | null>(null)

  const handleUpload = useCallback(async (file: File) => {
    setStep('processing')
    setProcessingError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('client_id', id)

      const response = await fetch('/api/import/pdf', {
        method: 'POST',
        body: formData,
      })

      const text = await response.text()
      let data: any
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setBatchId(data.batch_id)
      setIsImageBased(data.is_image_based)

      const rows: ReviewRow[] = data.extracted_rows.map((row: ExtractedRow) => ({
        id: row.id,
        selected: row.confidence !== 'low',
        title: row.title || '',
        work_type_id: row.matched_work_type_id || '',
        platform: row.platform || '',
        deadline: row.parsed_date ? row.parsed_date + (row.deadline_time ? 'T' + row.deadline_time : 'T00:00:00') : '',
        description: row.caption || '',
        notes: row.notes || '',
        is_billable: true,
        confidence: row.confidence,
        warnings: row.warnings,
        raw_text: row.raw_text,
      }))

      setReviewRows(rows)
      setStep('review')
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : 'Upload failed')
      setStep('error')
    }
  }, [id])

  const handleRetry = useCallback(() => {
    setStep('upload')
    setProcessingError(null)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!batchId) return

    setStep('confirming')

    const confirmResponse = await fetch('/api/import/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batch_id: batchId,
        client_id: id,
        rows: reviewRows,
      }),
    })

    const confirmText = await confirmResponse.text()
    let data: any
    try {
      data = JSON.parse(confirmText)
    } catch {
      throw new Error(`Server error (${confirmResponse.status}): ${confirmText.substring(0, 200)}`)
    }

    if (!confirmResponse.ok) {
      throw new Error(data.error || 'Confirmation failed')
    }

    setImportResult({ created: data.created })
    setStep('done')

    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['tasks-calendar'] })
    queryClient.invalidateQueries({ queryKey: ['task-stats'] })
    queryClient.invalidateQueries({ queryKey: ['import-batches'] })
  }, [batchId, id, reviewRows, queryClient])

  const handleDiscard = useCallback(async () => {
    if (!batchId) {
      router.push(`/clients/${id}`)
      return
    }

    try {
      await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          client_id: id,
          rows: [],
        }),
      })
    } catch {
      // Best effort
    }

    router.push(`/clients/${id}`)
  }, [batchId, id, router])

  const handleImportAnother = useCallback(() => {
    setStep('upload')
    setBatchId(null)
    setReviewRows([])
    setIsImageBased(false)
    setProcessingError(null)
    setImportResult(null)
  }, [])

  if (clientLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-[400px] w-full bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-xl font-semibold text-slate-300">Client not found</h2>
      </div>
    )
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {(['upload', 'review', 'done'] as const).map((s, i) => {
        const isActive = (step === 'upload' || step === 'processing' || step === 'error') && s === 'upload'
          || (step === 'review' || step === 'confirming') && s === 'review'
          || step === 'done' && s === 'done'
        const isCompleted = step === 'done' && s !== 'done'
          || (step === 'review' || step === 'confirming') && s === 'upload'
          || step === 'done' && s === 'review'

        return (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
              isActive ? 'bg-violet-600 border-violet-600 text-white' :
              isCompleted ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
              'border-slate-700 text-slate-500'
            }`}>
              {isCompleted ? '✓' : i + 1}
            </div>
            {i < 2 && <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-emerald-500/30' : 'bg-slate-700'}`} />}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen">
      {stepIndicator}

      {(step === 'upload' || step === 'error') && (
        <UploadStep
          clientName={client.business_name}
          clientId={id}
          onUpload={handleUpload}
          isProcessing={false}
          error={processingError}
          onRetry={handleRetry}
        />
      )}

      {step === 'processing' && (
        <UploadStep
          clientName={client.business_name}
          clientId={id}
          onUpload={handleUpload}
          isProcessing={true}
          error={null}
          onRetry={handleRetry}
        />
      )}

      {(step === 'review' || step === 'confirming') && (
        <ReviewStep
          clientId={id}
          clientName={client.business_name}
          batchId={batchId!}
          reviewRows={reviewRows}
          isImageBased={isImageBased}
          onRowsChange={setReviewRows}
          onConfirm={handleConfirm}
          onDiscard={handleDiscard}
          isConfirming={step === 'confirming'}
          onBackToUpload={handleRetry}
        />
      )}

      {step === 'done' && importResult && (
        <DoneStep
          clientName={client.business_name}
          clientId={id}
          tasksCreated={importResult.created}
          onImportAnother={handleImportAnother}
        />
      )}
    </div>
  )
}
