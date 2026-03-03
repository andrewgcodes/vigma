import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vigma — Design Tool',
  description: 'A sleek, minimalist design tool for creating frontends, components, images, and logos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  )
}
