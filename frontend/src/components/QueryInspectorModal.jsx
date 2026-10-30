import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Terminal, Database, Clock, FileCode, History, Sparkles, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

export default function QueryInspectorModal() {
  const { isInspectorOpen, closeQueryInspector, inspectQuery, openQueryInspector } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
  const [recentQueries, setRecentQueries] = useState([]);
  const [filterDb, setFilterDb] = useState('all');

  useEffect(() => {
    if (isInspectorOpen && activeTab === 'history') {
      api.getQueryHistory(40, filterDb === 'all' ? '' : filterDb)
        .then(res => setRecentQueries(res.queries || []))
        .catch(console.error);
    }
  }, [isInspectorOpen, activeTab, filterDb]);

  if (!isInspectorOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMongo = inspectQuery?.database === 'MongoDB';

  return (
    <div className="modal-overlay" onClick={closeQueryInspector}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '840px', background: '#080c16' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.35rem 1.75rem',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(12, 17, 30, 0.75)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{
              padding: '0.6rem',
              borderRadius: 'var(--radius-md)',
              background: isMongo ? 'var(--mongo-bg)' : 'var(--neo4j-bg)',
              color: isMongo ? 'var(--mongo-color)' : 'var(--neo4j-color)',
              border: `1px solid ${isMongo ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
              boxShadow: `0 0 15px ${isMongo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)'}`
            }}>
              <Terminal size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Database Query Inspector
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Real-Time Telemetry & Polyglot Architectural Rationale Audit
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              background: 'rgba(15, 23, 42, 0.8)', 
              borderRadius: 'var(--radius-full)', 
              padding: '3px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                className={`btn btn-sm`}
                style={{ 
                  fontSize: '0.78rem', 
                  padding: '0.3rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: activeTab === 'current' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === 'current' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: activeTab === 'current' ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none'
                }}
                onClick={() => setActiveTab('current')}
              >
                Active Query
              </button>
              <button
                className={`btn btn-sm`}
                style={{ 
                  fontSize: '0.78rem', 
                  padding: '0.3rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: activeTab === 'history' ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === 'history' ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: activeTab === 'history' ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none'
                }}
                onClick={() => setActiveTab('history')}
              >
                Session Log
              </button>
            </div>
            <button
              onClick={closeQueryInspector}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.45rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem' }}>
          {activeTab === 'current' ? (
            inspectQuery ? (
              <div>
                {/* Meta Telemetry Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  marginBottom: '1.25rem',
                  padding: '0.85rem 1.15rem',
                  background: 'rgba(15, 22, 38, 0.65)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${isMongo ? 'badge-mongo' : 'badge-neo4j'}`} style={{ fontSize: '0.8rem' }}>
                      <Database size={13} /> {inspectQuery.database}
                    </span>
                    <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>
                      {inspectQuery.operation}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem',
                      color: '#34d399',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      <Clock size={13} /> {inspectQuery.execution_ms} ms
                    </span>
                    {inspectQuery.records_affected !== undefined && (
                      <span>Records: <strong style={{ color: '#fff' }}>{inspectQuery.records_affected}</strong></span>
                    )}
                    <span style={{ color: 'var(--text-dim)' }}>Logged: {inspectQuery.timestamp}</span>
                  </div>
                </div>

                {/* Purpose & Academic Rationale */}
                {inspectQuery.purpose && (
                  <div style={{
                    marginBottom: '1.25rem',
                    padding: '1rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
                    borderLeft: '4px solid #6366f1',
                    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderLeftWidth: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                      <Sparkles size={16} color="#818cf8" />
                      <strong style={{ color: '#a5b4fc', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.06em' }}>
                        Architectural Rationale
                      </strong>
                    </div>
                    <span style={{ color: '#e2e8f0' }}>{inspectQuery.purpose}</span>
                  </div>
                )}

                {/* Query Code Container with One-Click Copy */}
                <div style={{ position: 'relative', marginTop: '0.85rem' }}>
                  <div style={{
                    position: 'absolute',
                    top: '0.85rem',
                    right: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    zIndex: 2
                  }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopy(inspectQuery.query_text)}
                      style={{ fontSize: '0.78rem', background: 'rgba(20, 29, 50, 0.9)' }}
                    >
                      {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copied ? 'Copied to Clipboard' : 'Copy Query'}
                    </button>
                  </div>
                  <pre className="code-block" style={{ 
                    maxHeight: '340px', 
                    padding: '1.25rem',
                    background: '#04060b',
                    color: isMongo ? '#a7f3d0' : '#bae6fd',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <code>{inspectQuery.query_text}</code>
                  </pre>
                </div>

                {/* Parameters */}
                {inspectQuery.params && Object.keys(inspectQuery.params).length > 0 && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ 
                      fontSize: '0.74rem', 
                      fontWeight: 800, 
                      color: 'var(--text-dim)', 
                      marginBottom: '0.45rem', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}>
                      Bound Execution Parameters:
                    </div>
                    <pre className="code-block" style={{ padding: '0.85rem', fontSize: '0.78rem', background: '#04060b' }}>
                      <code>{JSON.stringify(inspectQuery.params, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <Terminal size={45} style={{ opacity: 0.35, marginBottom: '1.25rem', color: '#6366f1' }} />
                <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.35rem' }}>No Query Selected</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '420px', margin: '0 auto' }}>
                  Click any "Show Query" badge across the catalogue, circulation desk, or analytics pages to inspect real execution metrics.
                </p>
              </div>
            )
          ) : (
            <div>
              {/* History Filter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Audit log of last <strong style={{ color: '#fff' }}>{recentQueries.length}</strong> executed queries
                </div>
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  {['all', 'mongodb', 'neo4j'].map(type => (
                    <button
                      key={type}
                      className={`btn btn-sm ${filterDb === type ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ textTransform: 'capitalize', padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => setFilterDb(type)}
                    >
                      {type === 'all' ? 'All Engines' : type === 'mongodb' ? 'MongoDB' : 'Neo4j'}
                    </button>
                  ))}
                </div>
              </div>

              {/* History List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto' }}>
                {recentQueries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No queries logged for this filter yet.
                  </div>
                ) : (
                  recentQueries.map((item, idx) => (
                    <div
                      key={idx}
                      className="glass-panel"
                      style={{
                        padding: '0.95rem 1.15rem',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${item.database === 'MongoDB' ? '#10b981' : '#06b6d4'}`,
                        background: 'rgba(12, 17, 30, 0.6)'
                      }}
                      onClick={() => {
                        openQueryInspector(item);
                        setActiveTab('current');
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                          <span className={`badge ${item.database === 'MongoDB' ? 'badge-mongo' : 'badge-neo4j'}`} style={{ fontSize: '0.72rem' }}>
                            {item.database}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{item.operation}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {item.execution_ms} ms • {item.timestamp}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.query_text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
