import 'server-only'
import { ExtractedRow, ExtractedRaw } from '@/types'
import { v4 as uuidv4 } from 'uuid'

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

export async function extractExcelContent(
  buffer: Buffer,
  workTypes: Array<{ id: string; name: string }>
): Promise<ExtractedRaw> {
  const XLSX = await import('xlsx')

  let workbook: ReturnType<typeof XLSX.read>
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch (error) {
    throw new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  const allRows: ExtractedRow[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

    if (jsonData.length === 0) continue

    const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase().trim())

    const dateCol = findColumn(headers, ['date', 'day', 'deadline', 'due', 'publish date', 'post date'])
    const titleCol = findColumn(headers, ['title', 'name', 'content', 'description', 'topic', 'subject', 'caption'])
    const platformCol = findColumn(headers, ['platform', 'channel', 'network', 'site', 'social'])
    const typeCol = findColumn(headers, ['type', 'content type', 'category', 'work type', 'format', 'kind'])
    const notesCol = findColumn(headers, ['notes', 'details', 'comments', 'memo', 'extra'])
    const captionCol = findColumn(headers, ['caption', 'copy', 'body', 'text', 'subtext'])
    const timeCol = findColumn(headers, ['time', 'deadline time', 'schedule', 'hour'])

    for (const row of jsonData) {
      const rawCells = Object.values(row).map(v => String(v ?? '')).join(' | ')

      const dateVal = dateCol !== null ? String(row[headers[dateCol]] ?? '').trim() : null
      const titleVal = titleCol !== null ? String(row[headers[titleCol]] ?? '').trim() : null
      const platformVal = platformCol !== null ? String(row[headers[platformCol]] ?? '').trim() : null
      const typeVal = typeCol !== null ? String(row[headers[typeCol]] ?? '').trim() : null
      const notesVal = notesCol !== null ? String(row[headers[notesCol]] ?? '').trim() : null
      const captionVal = captionCol !== null ? String(row[headers[captionCol]] ?? '').trim() : null
      const timeVal = timeCol !== null ? String(row[headers[timeCol]] ?? '').trim() : null

      if (!titleVal && !dateVal) continue

      const parsedDate = parseDate(dateVal)
      const platform = platformVal || detectPlatform(rawCells)
      const { matched, workTypeId } = matchWorkType(typeVal || rawCells, workTypes)

      allRows.push({
        id: uuidv4(),
        date: dateVal || null,
        parsed_date: parsedDate,
        title: titleVal || null,
        content_type: matched,
        matched_work_type_id: workTypeId,
        platform,
        caption: captionVal || null,
        notes: notesVal || null,
        deadline_time: timeVal && looksLikeTime(timeVal) ? normalizeTime(timeVal) : null,
        confidence: determineConfidence(dateVal, titleVal, workTypeId),
        warnings: buildWarnings(dateVal, parsedDate, titleVal, workTypeId),
        raw_text: rawCells,
      })
    }
  }

  return {
    rows: allRows,
    metadata: {
      page_count: workbook.SheetNames.length,
      text_length: JSON.stringify(allRows).length,
      extraction_method: 'excel',
      extracted_at: new Date().toISOString(),
    },
  }
}

function findColumn(headers: string[], candidates: string[]): number | null {
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h === candidate || h.includes(candidate))
    if (idx !== -1) return idx
  }
  return null
}

function looksLikeDate(str: string): boolean {
  if (!str || str.length > 30) return false
  return /(\d{1,2}[\\/\-\.]\d{1,2})|(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i.test(str)
}

function looksLikeTime(str: string): boolean {
  return /^\d{1,2}:\d{2}(\s*(am|pm))?$/i.test(str)
}

function normalizeTime(str: string): string {
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
  if (!match) return str
  let hours = parseInt(match[1])
  const minutes = match[2]
  const meridiem = match[3]?.toLowerCase()
  if (meridiem === 'pm' && hours < 12) hours += 12
  if (meridiem === 'am' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const currentYear = new Date().getFullYear()
  const cleaned = dateStr.trim()

  const native = new Date(cleaned)
  if (!isNaN(native.getTime())) {
    if (native.getFullYear() < 2000) native.setFullYear(currentYear)
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

function detectPlatform(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [keyword, platform] of Object.entries(PLATFORM_KEYWORDS)) {
    if (new RegExp(`\\b${keyword}\\b`).test(lower)) return platform
  }
  return null
}

function matchWorkType(
  text: string,
  workTypes: Array<{ id: string; name: string }>
): { matched: string | null; workTypeId: string | null } {
  const lower = text.toLowerCase()
  for (const wt of workTypes) {
    if (lower.includes(wt.name.toLowerCase())) return { matched: wt.name, workTypeId: wt.id }
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
