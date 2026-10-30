import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.75rem',
      right: '1.75rem',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '440px',
      width: '100%'
    }}>
      {toasts.map(t => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        const borderColor = isSuccess 
          ? 'rgba(16, 185, 129, 0.45)' 
          : isError 
          ? 'rgba(244, 63, 94, 0.45)' 
          : 'rgba(99, 102, 241, 0.45)';

        const glowColor = isSuccess 
          ? 'rgba(16, 185, 129, 0.25)' 
          : isError 
          ? 'rgba(244, 63, 94, 0.25)' 
          : 'rgba(99, 102, 241, 0.25)';

        return (
          <div
            key={t.id}
            style={{
              padding: '0.95rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(12, 17, 30, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${borderColor}`,
              borderTop: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: `0 12px 30px rgba(0, 0, 0, 0.7), 0 0 20px ${glowColor}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 500
            }}
          >
            {isSuccess ? (
              <CheckCircle2 size={20} color="#34d399" style={{ flexShrink: 0 }} />
            ) : isError ? (
              <AlertCircle size={20} color="#fb7185" style={{ flexShrink: 0 }} />
            ) : (
              <Info size={20} color="#818cf8" style={{ flexShrink: 0 }} />
            )}
            <span style={{ flex: 1, lineHeight: 1.45 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
