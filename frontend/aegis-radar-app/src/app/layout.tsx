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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-[#e0e0e0] font-mono antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `window.AEGIS_API_URL = ${JSON.stringify(apiUrl)};`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
