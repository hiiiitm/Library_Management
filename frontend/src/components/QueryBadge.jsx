import React from 'react';
import { Terminal, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function QueryBadge({ query, label = "Show Query" }) {
  const { openQueryInspector } = useApp();

  if (!query) return null;

  const isMongo = query.database === 'MongoDB';

  return (
    <button
      className="query-tag-btn"
      onClick={(e) => {
        e.stopPropagation();
        openQueryInspector(query);
      }}
      title={`Inspect live ${query.database} execution`}
      style={{
        border: `1px solid ${isMongo ? 'rgba(16, 185, 129, 0.35)' : 'rgba(6, 182, 212, 0.35)'}`,
        background: isMongo 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 7, 12, 0.8) 100%)' 
          : 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(5, 7, 12, 0.8) 100%)',
        boxShadow: `0 2px 8px ${isMongo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)'}`
      }}
    >
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: isMongo ? '#10b981' : '#06b6d4',
        boxShadow: `0 0 6px ${isMongo ? '#10b981' : '#06b6d4'}`
      }} />
      <span style={{ color: isMongo ? '#34d399' : '#38bdf8', fontWeight: 700 }}>
        {query.database}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>• {query.operation || 'Query'}</span>
    </button>
  );
}
