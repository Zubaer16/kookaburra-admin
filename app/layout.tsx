import type { Metadata } from 'next'
import './globals.css'
import { AdminProviders } from '@/components/providers'
export const metadata: Metadata = {
  title: { default: 'Kookaburra Admin', template: '%s | Kookaburra Admin' },
  description: 'Kookaburra commerce administration workspace',
  robots: { index: false, follow: false },
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  )
}
