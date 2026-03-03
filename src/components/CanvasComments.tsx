'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCollabStore } from '@/store/collab-store';
import { sendComment, sendDeleteComment, sendResolveComment } from '@/lib/collab';
import { MessageCircle, Send, Trash2, Check, X, Reply, CheckCircle2 } from 'lucide-react';

export default function CanvasComments() {
  const {
    comments,
    activeCommentId,
    setActiveCommentId,
    isCommentMode,
    setIsCommentMode,
    roomId,
    userId,
  } = useCollabStore();

  const [newCommentText, setNewCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [pendingClick, setPendingClick] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Get top-level comments (not replies)
  const topLevelComments = comments.filter((c) => !c.parent_id);

  // Get replies for a specific comment
  const getReplies = (commentId: string) =>
    comments.filter((c) => c.parent_id === commentId);

  // Get active comment thread
  const activeComment = activeCommentId
    ? comments.find((c) => c.id === activeCommentId)
    : null;
  const activeReplies = activeCommentId ? getReplies(activeCommentId) : [];

  // Handle canvas click in comment mode
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isCommentMode || !roomId) return;

    const canvas = document.querySelector('.canvas-container');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPendingClick({ x, y });
    setNewCommentText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Submit new comment
  const handleSubmitComment = () => {
    if (!newCommentText.trim() || !pendingClick) return;
    sendComment(newCommentText.trim(), pendingClick.x, pendingClick.y);
    setNewCommentText('');
    setPendingClick(null);
    setIsCommentMode(false);
  };

  // Submit reply
  const handleSubmitReply = () => {
    if (!replyText.trim() || !replyingTo || !activeComment) return;
    sendComment(replyText.trim(), activeComment.x, activeComment.y, replyingTo);
    setReplyText('');
    setReplyingTo(null);
  };

  // Focus reply input when replying
  useEffect(() => {
    if (replyingTo) {
      setTimeout(() => replyInputRef.current?.focus(), 50);
    }
  }, [replyingTo]);

  if (!roomId) return null;

  const formatTime = (iso: string) => {
    const d = new Date(iso + 'Z');
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      {/* Comment mode click overlay */}
      {isCommentMode && (
        <div
          className="comment-click-overlay"
          onClick={handleCanvasClick}
        >
          <div className="comment-mode-banner">
            <MessageCircle size={16} />
            <span>Click anywhere on the canvas to leave a comment</span>
            <button
              className="comment-mode-cancel"
              onClick={(e) => {
                e.stopPropagation();
                setIsCommentMode(false);
                setPendingClick(null);
              }}
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comment pins on canvas */}
      {topLevelComments.map((comment) => (
        <div
          key={comment.id}
          className={`comment-pin ${comment.resolved ? 'comment-pin-resolved' : ''} ${
            activeCommentId === comment.id ? 'comment-pin-active' : ''
          }`}
          style={{
            left: comment.x,
            top: comment.y,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveCommentId(activeCommentId === comment.id ? null : comment.id);
            setReplyingTo(null);
          }}
          title={`${comment.user_name}: ${comment.text}`}
        >
          <div
            className="comment-pin-avatar"
            style={{ backgroundColor: comment.user_color }}
          >
            <MessageCircle size={12} />
          </div>
          {getReplies(comment.id).length > 0 && (
            <span className="comment-pin-count">
              {getReplies(comment.id).length + 1}
            </span>
          )}
        </div>
      ))}

      {/* New comment input bubble */}
      {pendingClick && (
        <div
          className="comment-new-bubble"
          style={{
            left: pendingClick.x,
            top: pendingClick.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="comment-new-input-row">
            <input
              ref={inputRef}
              type="text"
              className="comment-new-input"
              placeholder="Add a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitComment();
                if (e.key === 'Escape') {
                  setPendingClick(null);
                  setIsCommentMode(false);
                }
              }}
            />
            <button
              className="comment-send-btn"
              onClick={handleSubmitComment}
              disabled={!newCommentText.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Active comment thread panel */}
      {activeComment && (
        <div
          className="comment-thread-panel"
          style={{
            left: Math.min(activeComment.x + 30, window.innerWidth - 340),
            top: Math.min(activeComment.y, window.innerHeight - 400),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="comment-thread-header">
            <span className="comment-thread-title">Comment Thread</span>
            <div className="comment-thread-actions">
              {!activeComment.resolved ? (
                <button
                  className="comment-resolve-btn"
                  onClick={() => sendResolveComment(activeComment.id, true)}
                  title="Resolve"
                >
                  <CheckCircle2 size={14} />
                </button>
              ) : (
                <button
                  className="comment-unresolve-btn"
                  onClick={() => sendResolveComment(activeComment.id, false)}
                  title="Unresolve"
                >
                  <CheckCircle2 size={14} />
                </button>
              )}
              <button
                className="comment-close-btn"
                onClick={() => {
                  setActiveCommentId(null);
                  setReplyingTo(null);
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {activeComment.resolved && (
            <div className="comment-resolved-badge">
              <Check size={12} /> Resolved
            </div>
          )}

          <div className="comment-thread-messages">
            {/* Original comment */}
            <div className="comment-message">
              <div
                className="comment-message-avatar"
                style={{ backgroundColor: activeComment.user_color }}
              >
                {activeComment.user_name[0]?.toUpperCase()}
              </div>
              <div className="comment-message-content">
                <div className="comment-message-header">
                  <span className="comment-message-name">
                    {activeComment.user_name}
                  </span>
                  <span className="comment-message-time">
                    {formatTime(activeComment.created_at)}
                  </span>
                </div>
                <p className="comment-message-text">{activeComment.text}</p>
                <div className="comment-message-actions">
                  <button
                    className="comment-action-btn"
                    onClick={() => setReplyingTo(activeComment.id)}
                  >
                    <Reply size={12} /> Reply
                  </button>
                  {activeComment.user_id === userId && (
                    <button
                      className="comment-action-btn comment-action-delete"
                      onClick={() => {
                        sendDeleteComment(activeComment.id);
                        setActiveCommentId(null);
                      }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Replies */}
            {activeReplies.map((reply) => (
              <div key={reply.id} className="comment-message comment-reply">
                <div
                  className="comment-message-avatar"
                  style={{ backgroundColor: reply.user_color }}
                >
                  {reply.user_name[0]?.toUpperCase()}
                </div>
                <div className="comment-message-content">
                  <div className="comment-message-header">
                    <span className="comment-message-name">
                      {reply.user_name}
                    </span>
                    <span className="comment-message-time">
                      {formatTime(reply.created_at)}
                    </span>
                  </div>
                  <p className="comment-message-text">{reply.text}</p>
                  {reply.user_id === userId && (
                    <div className="comment-message-actions">
                      <button
                        className="comment-action-btn comment-action-delete"
                        onClick={() => sendDeleteComment(reply.id)}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Reply input */}
          <div className="comment-reply-input-row">
            <input
              ref={replyInputRef}
              type="text"
              className="comment-reply-input"
              placeholder="Reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (!replyingTo) setReplyingTo(activeComment.id);
                  setTimeout(() => handleSubmitReply(), 0);
                }
                if (e.key === 'Escape') {
                  setReplyingTo(null);
                  setReplyText('');
                }
              }}
              onFocus={() => {
                if (!replyingTo) setReplyingTo(activeComment.id);
              }}
            />
            <button
              className="comment-send-btn"
              onClick={() => {
                if (!replyingTo) setReplyingTo(activeComment.id);
                setTimeout(() => handleSubmitReply(), 0);
              }}
              disabled={!replyText.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
