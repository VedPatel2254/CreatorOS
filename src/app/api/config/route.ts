import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    vapidPublicKey: 'BJ8Rx4hZ2psCqjvFlXcI6_YaaLpgzshci8Z3KTLPuA1O-HtY0fH0e4NsW99OotQ1r54h69cN9wBNDg-Vxqqi5gQ',
  })
}
