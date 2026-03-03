'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Comment } from '@/lib/collaboration'
import type { UserIdentity } from '@/lib/userIdentity'

interface CommentPinsProps {
  comments: Comment[]
  user: UserIdentity
  zoom: number
  panX: number
  panY: number
  onReply: (commentId: string, text: string) => void
  onDelete: (commentId: string) => void
  onDeleteReply: (commentId: string, replyId: string) => void
  onToggleResolve: (commentId: string) => void
  showResolved: boolean
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function CommentPins({
  comments,
  user,
  zoom,
  panX,
  panY,
  onReply,
  onDelete,
  onDeleteReply,
  onToggleResolve,
  showResolved,
}: CommentPinsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const filteredComments = showResolved ? comments : comments.filter(c => !c.resolved)

  const handleSubmitReply = (commentId: string) => {
    if (!replyText.trim()) return
    onReply(commentId, replyText.trim())
    setReplyText('')
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 35 }}>
      {filteredComments.map((comment, idx) => {
        const screenX = comment.x * zoom + panX
        const screenY = comment.y * zoom + panY
        const isExpanded = expandedId === comment.id

        return (
          <div
            key={comment.id}
            className="absolute"
            style={{
              left: screenX,
              top: screenY,
              transform: 'translate(-12px, -12px)',
            }}
          >
            {/* Pin marker */}
            <button
              className="pointer-events-auto w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md hover:scale-110 transition-transform cursor-pointer border-2 border-white"
              style={{
                backgroundColor: comment.resolved ? '#9ca3af' : comment.author.color,
              }}
              onClick={() => setExpandedId(isExpanded ? null : comment.id)}
              title={`${comment.author.name}: ${comment.text}`}
            >
              {idx + 1}
            </button>

            {/* Expanded comment thread */}
            {isExpanded && (
              <div
                className="pointer-events-auto absolute left-8 top-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                style={{ zIndex: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10px] font-medium text-gray-500">
                    Thread #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleResolve(comment.id)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${comment.resolved ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors`}
                    >
                      {comment.resolved ? 'Reopen' : 'Resolve'}
                    </button>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="p-0.5 rounded hover:bg-gray-200 text-gray-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Main comment */}
                <div className="px-3 py-2 border-b border-gray-50">
                  <div className="flex items-start gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ backgroundColor: comment.author.color }}
                    >
                      {comment.author.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-medium text-gray-900 truncate">
                          {comment.author.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-relaxed break-words">
                        {comment.text}
                      </p>
                    </div>
                    {comment.author.id === user.id && (
                      <button
                        onClick={() => { onDelete(comment.id); setExpandedId(null) }}
                        className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="border-b border-gray-50">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="px-3 py-1.5 group/reply hover:bg-gray-50">
                        <div className="flex items-start gap-2 pl-4">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                            style={{ backgroundColor: reply.author.color }}
                          >
                            {reply.author.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[10px] font-medium text-gray-800 truncate">
                                {reply.author.name}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                {formatTime(reply.timestamp)}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-600 leading-relaxed break-words">
                              {reply.text}
                            </p>
                          </div>
                          {reply.author.id === user.id && (
                            <button
                              onClick={() => onDeleteReply(comment.id, reply.id)}
                              className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 opacity-0 group-hover/reply:opacity-100 transition-all flex-shrink-0"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmitReply(comment.id)
                        if (e.key === 'Escape') setExpandedId(null)
                      }}
                      placeholder="Reply..."
                      className="flex-1 text-[11px] px-2 py-1.5 border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyText.trim()}
                      className="text-[10px] px-2.5 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
