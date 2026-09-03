import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderInvoicePdf } from '@/lib/server/invoice-pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, clients(id, business_name, contact_name, email, phone, address), invoice_line_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return new NextResponse('Invoice not found', { status: 404 })
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const business = {
      business_name: settings?.business_name ?? 'My Business',
      business_email: settings?.business_email ?? '',
      business_phone: settings?.business_phone ?? '',
      business_address: settings?.business_address ?? '',
      logo_url: settings?.logo_url ?? null,
      currency_symbol: settings?.currency_symbol ?? '₹',
      currency_code: settings?.currency_code ?? 'INR',
    }

    const lineItems = [...(invoice.invoice_line_items ?? [])].sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    )

    const pdfBuffer = await renderInvoicePdf({
      invoice,
      lineItems,
      client: invoice.clients,
      business,
      currencySymbol: business.currency_symbol,
    })

    const filename = `${invoice.invoice_number}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return new NextResponse('PDF generation failed', { status: 500 })
  }
}
