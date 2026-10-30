import React from 'react';
import QueryBadge from './QueryBadge';

export default function KpiCard({
  title,
  value,
  subvalue,
  icon: Icon,
  accent = 'indigo',
  query = null
}) {
  const accentPalettes = {
    indigo: {
      color: '#818cf8',
      bg: 'rgba(99, 102, 241, 0.16)',
      glow: 'rgba(99, 102, 241, 0.28)',
      border: 'rgba(99, 102, 241, 0.35)',
      gradient: 'linear-gradient(135deg, #ffffff 40%, #c7d2fe 100%)'
    },
    emerald: {
      color: '#34d399',
      bg: 'rgba(16, 185, 129, 0.16)',
      glow: 'rgba(16, 185, 129, 0.28)',
      border: 'rgba(16, 185, 129, 0.35)',
      gradient: 'linear-gradient(135deg, #ffffff 40%, #a7f3d0 100%)'
    },
    cyan: {
      color: '#38bdf8',
      bg: 'rgba(6, 182, 212, 0.16)',
      glow: 'rgba(6, 182, 212, 0.28)',
      border: 'rgba(6, 182, 212, 0.35)',
      gradient: 'linear-gradient(135deg, #ffffff 40%, #bae6fd 100%)'
    },
    amber: {
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.16)',
      glow: 'rgba(245, 158, 11, 0.28)',
      border: 'rgba(245, 158, 11, 0.35)',
      gradient: 'linear-gradient(135deg, #ffffff 40%, #fde68a 100%)'
    },
    rose: {
      color: '#fb7185',
      bg: 'rgba(244, 63, 94, 0.16)',
      glow: 'rgba(244, 63, 94, 0.28)',
      border: 'rgba(244, 63, 94, 0.35)',
      gradient: 'linear-gradient(135deg, #ffffff 40%, #fecdd3 100%)'
    },
    purple: {
      color: '#c084fc',
      bg: 'rgba(168, 85, 247, 0.16)',
      glow: 'rgba(168, 85, 247, 0.28)',
      border: 'rgba(168, 85, 247, 0.35)',
      gradient: 'linear-gradient(135deg, #ffffff 40%, #e9d5ff 100%)'
    }
  };

  const style = accentPalettes[accent] || accentPalettes.indigo;

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '1.45rem 1.65rem', 
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.16)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 14px 30px -4px rgba(0, 0, 0, 0.7), 0 0 25px ${style.glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-glass)';
      }}
    >
      {/* Ambient background glow flare */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: style.glow,
        filter: 'blur(35px)',
        pointerEvents: 'none'
      }} />

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '1rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          boxShadow: `0 4px 14px ${style.glow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {Icon && <Icon size={22} />}
        </div>

        {query && <QueryBadge query={query} />}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ 
          fontSize: '2.1rem', 
          fontWeight: 800, 
          letterSpacing: '-0.04em', 
          lineHeight: 1.1,
          background: style.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {value}
        </div>
        <div style={{ 
          fontSize: '0.9rem', 
          fontWeight: 700, 
          color: '#ffffff', 
          marginTop: '0.45rem',
          letterSpacing: '-0.01em'
        }}>
          {title}
        </div>
        {subvalue && (
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)', 
            marginTop: '0.25rem',
            lineHeight: 1.4
          }}>
            {subvalue}
          </div>
        )}
      </div>
    </div>
  );
}
