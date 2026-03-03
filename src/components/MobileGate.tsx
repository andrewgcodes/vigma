'use client'

import { useEffect, useState } from 'react'

/** Full-screen overlay shown on mobile/tablet viewports. */
export default function MobileGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const check = () => {
      // Treat anything narrower than 900px as "mobile/tablet"
      const mobile = window.innerWidth < 900 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      setIsMobile(mobile)
      setChecked(true)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Don't render anything until we've checked (avoids flash)
  if (!checked) return null

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white px-6">
        <div className="max-w-sm text-center">
          {/* Vigma V logo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg">
            <span className="text-3xl font-bold text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>V</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Vigma for Mobile
          </h1>
          <p className="text-lg text-violet-600 font-medium mb-4">
            Coming Soon
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Vigma is a full-featured design tool built for desktop browsers.
            Please visit on a desktop or laptop for the best experience.
          </p>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Built by <span className="text-gray-500">Devin</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
