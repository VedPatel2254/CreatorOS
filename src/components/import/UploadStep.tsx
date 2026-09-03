'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UploadStepProps {
  clientName: string
  clientId: string
  onUpload: (file: File) => Promise<void>
  isProcessing: boolean
  error: string | null
  onRetry: () => void
}

export function UploadStep({ clientName, clientId, onUpload, isProcessing, error, onRetry }: UploadStepProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are accepted.'
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be under 10MB.'
    }
    return null
  }, [])

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    setSelectedFile(file)
    onUpload(file)
  }, [validateFile, onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => router.push(`/clients/${clientId}`)} className="text-slate-400 hover:text-slate-50 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Client
        </Button>
        <div className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-violet-500 animate-spin" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">✓ Uploading PDF...</p>
              <p className="text-sm text-slate-400">⏳ Extracting content...</p>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-slate-400 mt-4">
                <FileText className="h-4 w-4" />
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => router.push(`/clients/${clientId}`)} className="text-slate-400 hover:text-slate-50 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />Back to Client
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-50">Import Content Calendar</h1>
        <p className="text-slate-400 mt-1">for {clientName}</p>
      </div>

      {(error || validationError) && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error || validationError}</p>
          {error && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 border-slate-700 text-slate-300">
              Try Again
            </Button>
          )}
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-violet-500 bg-violet-500/5'
            : 'border-slate-600 hover:border-violet-500 hover:bg-violet-500/5'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-300">
          Drop PDF here or click to browse
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Accepts PDF files up to 10MB
        </p>
      </div>

      <div className="mt-8 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <p className="text-sm font-medium text-slate-300 mb-2">Tips for best results:</p>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Use text-based PDFs (not scanned)</li>
          <li>• Tables extract better than lists</li>
          <li>• Always review before importing</li>
        </ul>
      </div>
    </div>
  )
}
