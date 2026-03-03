'use client'

import React, { useState } from 'react'
import { MessageCircle, Reply, Trash2, Check, CheckCircle, X } from 'lucide-react'
import type { Comment, CommentReply } from '@/lib/collaboration'
import type { UserIdentity } from '@/lib/userIdentity'

interface CommentsPanelProps {
  comments: Comment[]
  user: UserIdentity
  onAddReply: (commentId: string, text: string) => void
  onDeleteComment: (commentId: string) => void
  onDeleteReply: (commentId: string, replyId: string) => void
  onToggleResolve: (commentId: string) => void
  onScrollToComment: (comment: Comment) => void
  showResolved: boolean
  onToggleShowResolved: () => void
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function CommentsPanel({
  comments,
  user,
  onAddReply,
  onDeleteComment,
  onDeleteReply,
  onToggleResolve,
  onScrollToComment,
  showResolved,
  onToggleShowResolved,
}: CommentsPanelProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const filteredComments = showResolved ? comments : comments.filter(c => !c.resolved)

  const handleSubmitReply = (commentId: string) => {
    if (!replyText.trim()) return
    onAddReply(commentId, replyText.trim())
    setReplyText('')
    setReplyingTo(null)
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-canvas-text-tertiary py-12 px-4">
        <MessageCircle size={32} className="mb-3 opacity-40" />
        <p className="text-sm font-medium mb-1">No comments yet</p>
        <p className="text-xs text-center opacity-70">
          Use the comment tool (C) to click on the canvas and leave a comment
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-border">
        <span className="text-xs font-medium text-canvas-text-secondary">
          {filteredComments.length} comment{filteredComments.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onToggleShowResolved}
          className="text-[10px] px-2 py-0.5 rounded hover:bg-canvas-hover text-canvas-text-tertiary transition-colors"
        >
          {showResolved ? 'Hide resolved' : 'Show resolved'}
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {filteredComments.map((comment, idx) => (
          <div
            key={comment.id}
            className={`border-b border-canvas-border ${comment.resolved ? 'opacity-60' : ''}`}
          >
            {/* Main comment */}
            <div
              className="px-3 py-2.5 hover:bg-canvas-hover/50 cursor-pointer group"
              onClick={() => onScrollToComment(comment)}
            >
              <div className="flex items-start gap-2">
                {/* Author avatar */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: comment.author.color }}
                >
                  {comment.author.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium text-canvas-text truncate">
                      {comment.author.name}
                    </span>
                    <span className="text-[10px] text-canvas-text-tertiary flex-shrink-0">
                      {formatTime(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-canvas-text-secondary leading-relaxed break-words">
                    {comment.text}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleResolve(comment.id) }}
                    className="p-1 rounded hover:bg-canvas-hover text-canvas-text-tertiary hover:text-green-600 transition-colors"
                    title={comment.resolved ? 'Unresolve' : 'Resolve'}
                  >
                    {comment.resolved ? <CheckCircle size={12} /> : <Check size={12} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReplyingTo(replyingTo === comment.id ? null : comment.id) }}
                    className="p-1 rounded hover:bg-canvas-hover text-canvas-text-tertiary hover:text-blue-600 transition-colors"
                    title="Reply"
                  >
                    <Reply size={12} />
                  </button>
                  {comment.author.id === user.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteComment(comment.id) }}
                      className="p-1 rounded hover:bg-canvas-hover text-canvas-text-tertiary hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Comment number badge */}
              <div className="absolute -left-0.5 top-3 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                style={{ backgroundColor: comment.author.color, display: 'none' }}
              >
                {idx + 1}
              </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="pl-7 pr-3 pb-1">
                {comment.replies.map((reply: CommentReply) => (
                  <div key={reply.id} className="py-1.5 group/reply">
                    <div className="flex items-start gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: reply.author.color }}
                      >
                        {reply.author.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] font-medium text-canvas-text truncate">
                            {reply.author.name}
                          </span>
                          <span className="text-[10px] text-canvas-text-tertiary flex-shrink-0">
                            {formatTime(reply.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-canvas-text-secondary leading-relaxed break-words">
                          {reply.text}
                        </p>
                      </div>
                      {reply.author.id === user.id && (
                        <button
                          onClick={() => onDeleteReply(comment.id, reply.id)}
                          className="p-0.5 rounded hover:bg-canvas-hover text-canvas-text-tertiary hover:text-red-500 opacity-0 group-hover/reply:opacity-100 transition-all flex-shrink-0"
                          title="Delete reply"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply input */}
            {replyingTo === comment.id && (
              <div className="pl-7 pr-3 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitReply(comment.id); if (e.key === 'Escape') { setReplyingTo(null); setReplyText('') } }}
                    placeholder="Reply..."
                    className="flex-1 text-[11px] px-2 py-1 border border-canvas-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyText.trim()}
                    className="text-[10px] px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => { setReplyingTo(null); setReplyText('') }}
                    className="p-1 rounded hover:bg-canvas-hover text-canvas-text-tertiary"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
