'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCollabStore } from '@/store/collab-store';
import { createRoom, connectToRoom, disconnectFromRoom, getRoomShareUrl, sendNameChange } from '@/lib/collab';
import { X, Copy, Check, Users, Link, Wifi, WifiOff, Edit3 } from 'lucide-react';

export default function ShareModal() {
  const {
    showShareModal, setShowShareModal,
    isConnected, roomId, userId, userName, userColor, users,
  } = useCollabStore();

  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  // Close modal on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowShareModal(false);
      }
    }
    if (showShareModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareModal, setShowShareModal]);

  if (!showShareModal) return null;

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const newRoomId = await createRoom();
      connectToRoom(newRoomId);
      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoomId);
      window.history.pushState({}, '', url.toString());
    } catch (err) {
      console.error('Failed to create room:', err);
    }
    setIsCreating(false);
  };

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = getRoomShareUrl(roomId);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDisconnect = () => {
    disconnectFromRoom();
    // Remove room param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      sendNameChange(nameInput.trim());
    }
    setEditingName(false);
  };

  return (
    <div className="share-modal-backdrop">
      <div className="share-modal" ref={modalRef}>
        <div className="share-modal-header">
          <h3>Live Collaboration</h3>
          <button className="share-modal-close" onClick={() => setShowShareModal(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="share-modal-body">
          {!roomId ? (
            <div className="share-create-section">
              <div className="share-info">
                <Users size={32} className="share-icon" />
                <p>Start a live collaboration session. Share the link with others to edit together in real-time.</p>
              </div>
              <button
                className="share-create-btn"
                onClick={handleCreateRoom}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Start Collaboration'}
              </button>
            </div>
          ) : (
            <>
              {/* Connection status */}
              <div className="share-status">
                <div className={`share-status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                <span>
                  {isConnected ? (
                    <><Wifi size={14} /> Connected</>
                  ) : (
                    <><WifiOff size={14} /> Reconnecting...</>
                  )}
                </span>
              </div>

              {/* Share link */}
              <div className="share-link-section">
                <label>Share this link</label>
                <div className="share-link-row">
                  <input
                    type="text"
                    value={getRoomShareUrl(roomId)}
                    readOnly
                    className="share-link-input"
                  />
                  <button className="share-copy-btn" onClick={handleCopyLink}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Your identity */}
              <div className="share-user-section">
                <label>Your name</label>
                {editingName ? (
                  <div className="share-name-edit">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameSubmit();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                      onBlur={handleNameSubmit}
                      className="share-name-input"
                      maxLength={20}
                    />
                  </div>
                ) : (
                  <div className="share-name-display" onClick={() => { setEditingName(true); setNameInput(userName || ''); }}>
                    <div className="share-user-avatar" style={{ backgroundColor: userColor || '#3b82f6' }}>
                      {(userName || 'U')[0].toUpperCase()}
                    </div>
                    <span>{userName}</span>
                    <Edit3 size={12} className="share-edit-icon" />
                  </div>
                )}
              </div>

              {/* Connected users */}
              <div className="share-users-section">
                <label>
                  <Users size={14} />
                  {users.length} user{users.length !== 1 ? 's' : ''} in room
                </label>
                <div className="share-users-list">
                  {users.map((u) => (
                    <div key={u.id} className="share-user-item">
                      <div className="share-user-avatar" style={{ backgroundColor: u.color }}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <span>{u.name} {u.id === userId ? '(you)' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disconnect */}
              <button className="share-disconnect-btn" onClick={handleDisconnect}>
                <Link size={14} />
                Leave Room
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
