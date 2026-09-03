import 'server-only'
import * as pdfParseModule from 'pdf-parse'
import { ExtractedRow, ExtractedRaw } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const pdfParse = (pdfParseModule as any).default || pdfParseModule

export async function extractPdfContent(
  buffer: Buffer,
  workTypes: Array<{ id: string; name: string }>
): Promise<ExtractedRaw> {
  let pdfData: { text: string; numpages: number }

  try {
    pdfData = await pdfParse(buffer)
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  const rawText = pdfData.text
  const pageCount = pdfData.numpages

  const isImageBased = rawText.trim().length < 100

  if (isImageBased) {
    return {
      rows: [],
      metadata: {
        page_count: pageCount,
        text_length: rawText.length,
        extraction_method: 'ocr_unavailable',
        extracted_at: new Date().toISOString(),
      },
    }
  }

  const rows = extractRows(rawText, workTypes)

  return {
    rows,
    metadata: {
      page_count: pageCount,
      text_length: rawText.length,
      extraction_method: 'text',
      extracted_at: new Date().toISOString(),
    },
  }
}

function extractRows(
  text: string,
  workTypes: Array<{ id: string; name: string }>
): ExtractedRow[] {
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' | ')
    .trim()

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean)

  const tableRows = tryTableExtraction(lines, workTypes)
  if (tableRows.length >= 2) {
    return tableRows
  }

  const structuredRows = tryStructuredExtraction(lines, workTypes)
  if (structuredRows.length >= 2) {
    return structuredRows
  }

  return tryParagraphExtraction(lines, workTypes)
}

function tryTableExtraction(
  lines: string[],
  workTypes: Array<{ id: string; name: string }>
): ExtractedRow[] {
  const pipeLines = lines.filter(l => l.includes('|') && l.split('|').length >= 3)

  if (pipeLines.length < 2) return []

  const rows: ExtractedRow[] = []

  for (const line of pipeLines) {
    const cells = line.split('|').map(c => c.trim())
    if (cells.length < 2) continue

    const isHeader = cells.some(c =>
      /^(date|day|type|content|platform|title|description|caption|notes|deadline)$/i.test(c)
    )
    if (isHeader) continue

    let dateCell: string | null = null
    let dateIndex = -1
    for (let i = 0; i < cells.length; i++) {
      if (looksLikeDate(cells[i])) {
        dateCell = cells[i]
        dateIndex = i
        break
      }
    }

    const { matched, workTypeId } = matchWorkType(cells.join(' '), workTypes)

    const remainingCells = cells.filter((_, i) => i !== dateIndex)

    const title = remainingCells[0] || null
    const platform = detectPlatform(cells.join(' '))
    const parsedDate = dateCell ? parseDate(dateCell) : null

    const row: ExtractedRow = {
      id: uuidv4(),
      date: dateCell,
      parsed_date: parsedDate,
      title,
      content_type: matched,
      matched_work_type_id: workTypeId,
      platform,
      caption: remainingCells[1] || null,
      notes: remainingCells[2] || null,
      deadline_time: null,
      confidence: determineConfidence(dateCell, title, workTypeId),
      warnings: buildWarnings(dateCell, parsedDate, title, workTypeId),
      raw_text: line,
    }

    rows.push(row)
  }

  return rows
}

function tryStructuredExtraction(
  lines: string[],
  workTypes: Array<{ id: string; name: string }>
): ExtractedRow[] {
  const rows: ExtractedRow[] = []
  const DATE_PREFIXED = /^(\d{1,2}[\\/\-\.]\d{1,2}(?:[\\/\-\.]\d{2,4})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s*\d{4})?|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?)/i

  for (const line of lines) {
    if (!DATE_PREFIXED.test(line)) continue

    const dateMatch = line.match(DATE_PREFIXED)
    if (!dateMatch) continue

    const dateStr = dateMatch[0]
    const rest = line.slice(dateMatch.index! + dateStr.length).replace(/^[\s\-:–]+/, '')
    const parsedDate = parseDate(dateStr)
    const { matched, workTypeId } = matchWorkType(rest, workTypes)
    const platform = detectPlatform(rest)

    rows.push({
      id: uuidv4(),
      date: dateStr,
      parsed_date: parsedDate,
      title: rest.length > 0 ? rest.substring(0, 150) : null,
      content_type: matched,
      matched_work_type_id: workTypeId,
      platform,
      caption: null,
      notes: null,
      deadline_time: extractTime(line),
      confidence: determineConfidence(dateStr, rest || null, workTypeId),
      warnings: buildWarnings(dateStr, parsedDate, rest || null, workTypeId),
      raw_text: line,
    })
  }

  return rows
}

function tryParagraphExtraction(
  lines: string[],
  workTypes: Array<{ id: string; name: string }>
): ExtractedRow[] {
  const rows: ExtractedRow[] = []
  const chunks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    if (line === '') {
      if (current.length > 0) {
        chunks.push(current)
        current = []
      }
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) chunks.push(current)

  for (const chunk of chunks) {
    const fullText = chunk.join(' ')
    let dateStr: string | null = null
    let parsedDate: string | null = null

    for (const line of chunk) {
      if (looksLikeDate(line)) {
        dateStr = line
        parsedDate = parseDate(line)
        break
      }
      const dateInLine = extractDateFromLine(line)
      if (dateInLine) {
        dateStr = dateInLine
        parsedDate = parseDate(dateInLine)
        break
      }
    }

    const { matched, workTypeId } = matchWorkType(fullText, workTypes)
    const platform = detectPlatform(fullText)
    const title = chunk[0]?.substring(0, 150) || null

    rows.push({
      id: uuidv4(),
      date: dateStr,
      parsed_date: parsedDate,
      title,
      content_type: matched,
      matched_work_type_id: workTypeId,
      platform,
      caption: chunk.length > 1 ? chunk.slice(1).join(' ').substring(0, 500) : null,
      notes: null,
      deadline_time: null,
      confidence: 'low',
      warnings: [
        'Extracted from unstructured text — please review carefully',
        ...buildWarnings(dateStr, parsedDate, title, workTypeId),
      ],
      raw_text: fullText,
    })
  }

  return rows
}

function looksLikeDate(str: string): boolean {
  if (!str || str.length > 30) return false
  return /(\d{1,2}[\\/\-\.]\d{1,2})|(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i.test(str)
}

function extractDateFromLine(line: string): string | null {
  const match = line.match(
    /(\d{1,2}[\\/\-\.]\d{1,2}(?:[\\/\-\.]\d{2,4})?|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{2,4})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s*\d{4})?)/i
  )
  return match ? match[0] : null
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null

  const currentYear = new Date().getFullYear()
  const cleaned = dateStr.trim()

  const native = new Date(cleaned)
  if (!isNaN(native.getTime())) {
    if (native.getFullYear() < 2000) {
      native.setFullYear(currentYear)
    }
    return native.toISOString().split('T')[0]
  }

  const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/)
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1])
    const month = parseInt(dmyMatch[2]) - 1
    const year = dmyMatch[3]
      ? (dmyMatch[3].length === 2 ? 2000 + parseInt(dmyMatch[3]) : parseInt(dmyMatch[3]))
      : currentYear
    const d = new Date(year, month, day)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  const monthNames: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  }

  const wordMatch = cleaned.match(
    /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{2,4}))?$|^([a-z]+)\s+(\d{1,2})(?:,?\s*(\d{2,4}))?$/i
  )
  if (wordMatch) {
    let day: number, monthKey: string, year: number

    if (wordMatch[1]) {
      day = parseInt(wordMatch[1])
      monthKey = wordMatch[2].toLowerCase().substring(0, 3)
      year = wordMatch[3] ? parseInt(wordMatch[3]) : currentYear
    } else {
      monthKey = wordMatch[4].toLowerCase().substring(0, 3)
      day = parseInt(wordMatch[5])
      year = wordMatch[6] ? parseInt(wordMatch[6]) : currentYear
    }

    if (monthKey in monthNames) {
      const d = new Date(year, monthNames[monthKey], day)
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    }
  }

  return null
}

function extractTime(text: string): string | null {
  const match = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i)
  if (!match) return null
  let hours = parseInt(match[1])
  const minutes = match[2]
  const meridiem = match[3]?.toLowerCase()
  if (meridiem === 'pm' && hours < 12) hours += 12
  if (meridiem === 'am' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

const PLATFORM_KEYWORDS: Record<string, string> = {
  instagram: 'Instagram',
  ig: 'Instagram',
  insta: 'Instagram',
  youtube: 'YouTube',
  yt: 'YouTube',
  facebook: 'Facebook',
  fb: 'Facebook',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  tiktok: 'TikTok',
  website: 'Website',
  blog: 'Website',
  reels: 'Instagram',
}

function detectPlatform(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [keyword, platform] of Object.entries(PLATFORM_KEYWORDS)) {
    if (new RegExp(`\\b${keyword}\\b`).test(lower)) {
      return platform
    }
  }
  return null
}

function matchWorkType(
  text: string,
  workTypes: Array<{ id: string; name: string }>
): { matched: string | null; workTypeId: string | null } {
  const lower = text.toLowerCase()
  for (const wt of workTypes) {
    if (lower.includes(wt.name.toLowerCase())) {
      return { matched: wt.name, workTypeId: wt.id }
    }
  }
  return { matched: null, workTypeId: null }
}

function determineConfidence(
  dateStr: string | null,
  title: string | null,
  workTypeId: string | null
): 'high' | 'medium' | 'low' {
  const hasDate = !!dateStr
  const hasParsedDate = dateStr ? !!parseDate(dateStr) : false
  const hasTitle = !!title && title.length > 3
  const hasWorkType = !!workTypeId

  if (hasParsedDate && hasTitle && hasWorkType) return 'high'
  if ((hasParsedDate || hasDate) && hasTitle) return 'medium'
  return 'low'
}

function buildWarnings(
  dateStr: string | null,
  parsedDate: string | null,
  title: string | null,
  workTypeId: string | null
): string[] {
  const warnings: string[] = []
  if (!dateStr) warnings.push('No date detected — please set manually')
  else if (!parsedDate) warnings.push(`Could not parse date "${dateStr}" — please set manually`)
  if (!title || title.length < 3) warnings.push('Title is very short or missing')
  if (!workTypeId) warnings.push('Work type could not be detected — please select manually')
  return warnings
}
