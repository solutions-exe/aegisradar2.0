import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AEGIS RADAR',
  description: 'Business Fraud Defense System',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-[#e0e0e0] font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
