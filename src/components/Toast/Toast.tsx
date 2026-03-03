import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../store/canvasStore';

export default function Toast() {
  const { state } = useAppContext();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (state.toastMessage) {
      setMessage(state.toastMessage);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [state.toastMessage]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#333333] text-white rounded-lg px-5 py-2.5 text-[13px] shadow-lg transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {message}
    </div>
  );
}
