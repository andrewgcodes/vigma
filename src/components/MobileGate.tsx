'use client'

import { useEffect, useState } from 'react'

/**
 * Full-screen overlay shown on mobile/tablet viewports.
 *
 * Children are always rendered (hidden via display:none on mobile) so that
 * canvas refs and useEffect hooks in child components initialise correctly.
 * The previous approach returned null before the check completed, which
 * prevented the canvas ref from being in the DOM when DesignPage's
 * one-time useEffect fired — breaking the entire editor.
 */
export default function MobileGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 900 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <>
      {/* Always render children so canvas refs/effects initialise correctly */}
      <div style={isMobile ? { display: 'none' } : undefined}>
        {children}
      </div>

      {/* Mobile overlay */}
      {isMobile && (
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
      )}
    </>
  )
}
