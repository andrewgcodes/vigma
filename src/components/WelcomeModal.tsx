'use client'

import React, { useState, useEffect } from 'react'
import { X, Share2, MessageSquare, Send } from 'lucide-react'

const WELCOME_DISMISSED_KEY = 'vigma-welcome-dismissed'

interface WelcomeModalProps {
  onClose: () => void
}

function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">V</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Welcome to Vigma</h2>
              <p className="text-xs text-gray-500">A browser-based design tool</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Vigma is a free, open-source design tool that runs entirely in your browser. No account needed.
            It is <span className="font-medium">not affiliated with Figma</span> in any way.
          </p>

          <div className="space-y-3">
            <FeatureRow
              icon={<Share2 size={16} />}
              title="Live Collaboration"
              description='Click "Share" in the top bar to generate a link. Anyone with the link can join your session in real-time — no sign-up required.'
            />
            <FeatureRow
              icon={<MessageSquare size={16} />}
              title="Comments"
              description='Press C to switch to the Comment tool, then click anywhere on the canvas to leave a comment. Reply, resolve, and delete threads.'
            />
            <FeatureRow
              icon={<Send size={16} />}
              title="Feedback"
              description={
                <>
                  We&apos;d love to hear from you!{' '}
                  <a href="https://forms.gle/oNS1Q1pnR8GTjJvYA" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Submit feedback
                  </a>{' '}
                  or tag{' '}
                  <a href="https://twitter.com/itsandrewgao" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    @itsandrewgao
                  </a>{' '}
                  on Twitter.
                </>
              }
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Built by{' '}
              <a href="https://devin.ai/?utm_source=vigma.io" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                Devin
              </a>
              {' '}&middot;{' '}
              Your designs are saved locally in your browser
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}

function FeatureRow({ icon, title, description }: { icon: React.ReactNode, title: string, description: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-gray-50">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export default function WelcomeModalWrapper() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY)
    if (!dismissed) {
      setShow(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(WELCOME_DISMISSED_KEY, 'true')
    setShow(false)
  }

  if (!show) return null
  return <WelcomeModal onClose={handleClose} />
}
