import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ServiceWorkerProvider } from '@/components/providers/ServiceWorkerProvider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'CreatorOS — Work Management for Creative Agencies',
    template: '%s | CreatorOS',
  },
  description: 'Manage clients, track deliveries, generate invoices, and monitor billing — all in one place.',
  robots: { index: false, follow: false },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CreatorOS',
  },
  icons: {
    icon: [
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('creatoros-theme')||'dark';var r=t;if(t==='system')r=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.classList.add(r)}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-50`}>
        <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
        <Toaster />
      </body>
    </html>
  )
}
