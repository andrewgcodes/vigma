'use client'

import { useEffect } from 'react'

export default function FeedbackPage() {
  useEffect(() => {
    window.location.href = 'https://forms.gle/oNS1Q1pnR8GTjJvYA'
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-gray-500">Redirecting to feedback form...</p>
        <a
          href="https://forms.gle/oNS1Q1pnR8GTjJvYA"
          className="text-xs text-blue-500 hover:underline mt-2 inline-block"
        >
          Click here if not redirected
        </a>
      </div>
    </div>
  )
}
