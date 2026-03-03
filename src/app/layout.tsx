import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const SITE_URL = 'https://vigma.io'
const SITE_NAME = 'Vigma'
const SITE_DESCRIPTION =
  'Vigma is a free, browser-based design tool for creating UI designs, components, images, and logos. No sign-up required. A powerful alternative to Figma — built entirely by Devin AI.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Vigma — Free Online Design Tool | Built by Devin AI',
    template: '%s | Vigma',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'design tool',
    'free design tool',
    'online design tool',
    'figma alternative',
    'free figma alternative',
    'browser design tool',
    'UI design tool',
    'graphic design tool',
    'web design tool',
    'logo maker',
    'component designer',
    'vector editor',
    'collaborative design',
    'no sign up design tool',
    'AI built design tool',
    'Devin AI',
    'vigma',
  ],
  authors: [
    { name: 'Andrew Gao', url: 'https://twitter.com/itsandrewgao' },
    { name: 'Devin AI', url: 'https://devin.ai' },
  ],
  creator: 'Devin AI',
  publisher: 'Andrew Gao',
  applicationName: SITE_NAME,
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  category: 'Design Tools',

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Vigma — Free Online Design Tool | Built by Devin AI',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vigma — Free browser-based design tool',
        type: 'image/png',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Vigma — Free Online Design Tool',
    description: SITE_DESCRIPTION,
    creator: '@itsandrewgao',
    images: ['/og-image.png'],
  },

  // Icons
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // Manifest
  manifest: '/manifest.json',

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Canonical
  alternates: {
    canonical: SITE_URL,
  },

  // Additional meta
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': SITE_NAME,
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0071e3',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0071e3' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // JSON-LD structured data for Google rich results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Person',
      name: 'Andrew Gao',
      url: 'https://twitter.com/itsandrewgao',
    },
    creator: {
      '@type': 'Organization',
      name: 'Devin AI',
      url: 'https://devin.ai',
    },
    featureList: [
      'Vector shapes and drawing tools',
      'Text editing and typography',
      'Layer management',
      'Multiple pages support',
      'Real-time collaboration',
      'Export to PNG, SVG, JPG, PDF',
      'Import and export JSON projects',
      'Grid and snap-to-grid',
      'Undo/redo history',
      'Keyboard shortcuts',
      'No sign-up required',
    ],
    screenshot: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/og-image.png`,
    },
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}<Analytics /></body>
    </html>
  )
}
