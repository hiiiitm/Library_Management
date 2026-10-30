import React from 'react';
import { Star, BookOpen, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Genre to curated aesthetic gradients
const GENRE_GRADIENTS = {
  'Computer Science & Technology': 'linear-gradient(135deg, #0284c7 0%, #1e1b4b 100%)',
  'Indian Authors': 'linear-gradient(135deg, #f97316 0%, #451a03 100%)',
  'Classics': 'linear-gradient(135deg, #3b82f6 0%, #0f172a 100%)',
  'Sci-Fi': 'linear-gradient(135deg, #8b5cf6 0%, #172554 100%)',
  'Fantasy': 'linear-gradient(135deg, #a855f7 0%, #311042 100%)',
  'Mystery': 'linear-gradient(135deg, #64748b 0%, #020617 100%)',
  'Thriller': 'linear-gradient(135deg, #ef4444 0%, #18181b 100%)',
  'Philosophy': 'linear-gradient(135deg, #eab308 0%, #292524 100%)',
  'Science': 'linear-gradient(135deg, #06b6d4 0%, #042f2e 100%)',
  'History': 'linear-gradient(135deg, #d97706 0%, #1c1917 100%)',
  'Biography': 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
  'Self-Help': 'linear-gradient(135deg, #14b8a6 0%, #134e4a 100%)',
  'Business': 'linear-gradient(135deg, #6366f1 0%, #1e1b4b 100%)',
  'Romance': 'linear-gradient(135deg, #ec4899 0%, #500724 100%)',
  'Fiction': 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
  'Poetry': 'linear-gradient(135deg, #c084fc 0%, #3b0764 100%)',
  'Children': 'linear-gradient(135deg, #fbbf24 0%, #78350f 100%)',
  'Graphic Novels': 'linear-gradient(135deg, #f43f5e 0%, #4c0519 100%)'
};

export default function BookCard({ book, onSelect }) {
  const { navigateToBook } = useApp();

  if (!book) return null;

  const primaryGenre = book.genres?.[0] || 'Fiction';
  const coverGradient = GENRE_GRADIENTS[primaryGenre] || 'linear-gradient(135deg, #6366f1 0%, #0f172a 100%)';

  // Extract initials
  const initials = book.title
    .split(' ')
    .filter(w => !['the', 'a', 'an', 'of', 'and', 'in'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || book.title.slice(0, 2).toUpperCase();

  const authorNames = book.authors?.map(a => a.name).join(', ') || 'Unknown Author';
  const isAvailable = (book.available_copies || 0) > 0;

  const handleClick = () => {
    if (onSelect) {
      onSelect(book);
    } else {
      navigateToBook(book.book_id);
    }
  };

  return (
    <div 
      className="glass-panel"
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderTop: '1px solid rgba(255, 255, 255, 0.18)',
        transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-7px) scale(1.015)';
        e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(99, 102, 241, 0.25)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = 'var(--shadow-glass)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >
      {/* 3D Luxury Hardcover Cover Header */}
      <div style={{
        height: '160px',
        background: coverGradient,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.15rem',
        boxShadow: 'inset 0 -20px 30px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {/* Book Spine Crease & Depth Overlay */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '18px',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(255,255,255,0.12) 20%, transparent 100%)',
          borderRight: '1px solid rgba(0,0,0,0.2)',
          pointerEvents: 'none'
        }} />

        {/* Top Badges */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 2,
          paddingLeft: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#ffffff',
            background: 'rgba(0, 0, 0, 0.45)',
            padding: '0.22rem 0.55rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            letterSpacing: '0.04em',
            backdropFilter: 'blur(6px)'
          }}>
            {book.book_id}
          </span>

          <span 
            className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`} 
            style={{ 
              backdropFilter: 'blur(6px)',
              fontSize: '0.72rem',
              boxShadow: isAvailable ? '0 0 10px rgba(16, 185, 129, 0.3)' : '0 0 10px rgba(244, 63, 94, 0.3)'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isAvailable ? '#34d399' : '#fb7185',
              display: 'inline-block'
            }} />
            {isAvailable ? `${book.available_copies} In Stock` : 'Checked Out'}
          </span>
        </div>

        {/* Big Monogram Watermark */}
        <div style={{
          position: 'absolute',
          right: '1rem',
          bottom: '-0.3rem',
          fontSize: '4.25rem',
          fontWeight: 900,
          color: 'rgba(255, 255, 255, 0.14)',
          userSelect: 'none',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          pointerEvents: 'none',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          {initials}
        </div>

        {/* Genre Pill on Cover */}
        <div style={{ position: 'relative', zIndex: 2, paddingLeft: '0.5rem' }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#ffffff',
            textShadow: '0 2px 6px rgba(0,0,0,0.7)',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            {primaryGenre}
          </span>
        </div>
      </div>

      {/* Book Metadata Body */}
      <div style={{ 
        padding: '1.35rem', 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        justifyContent: 'space-between',
        background: 'rgba(10, 15, 26, 0.6)'
      }}>
        <div>
          <h4 style={{
            fontSize: '1.02rem',
            fontWeight: 700,
            lineHeight: 1.4,
            marginBottom: '0.45rem',
            color: '#ffffff',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {book.title}
          </h4>

          <p style={{
            fontSize: '0.84rem',
            color: 'var(--text-muted)',
            marginBottom: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            <User size={14} style={{ flexShrink: 0, color: 'var(--text-accent)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{authorNames}</span>
          </p>

          <p style={{
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            lineHeight: 1.5,
            marginBottom: '1rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {book.description}
          </p>
        </div>

        {/* Footer info: Rating + Publication Year */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontWeight: 700 }}>
            <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
            <span>{book.avg_rating > 0 ? book.avg_rating.toFixed(1) : 'New'}</span>
            <span style={{ color: 'var(--text-dim)', fontWeight: 500, fontSize: '0.75rem' }}>
              ({book.ratings_count || 0})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)' }}>
            <Calendar size={13} />
            <span>{book.publication_year}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
