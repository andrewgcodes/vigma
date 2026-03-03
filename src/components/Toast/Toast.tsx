import { useEffect } from 'react';
import { useAppContext } from '../../store/canvasStore';

export default function Toast() {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    if (state.toastMessage) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toastMessage, dispatch]);

  if (!state.toastMessage) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
      <div className="bg-[#333333] text-white rounded-lg px-5 py-2.5 text-[13px] shadow-lg">
        {state.toastMessage}
      </div>
    </div>
  );
}
