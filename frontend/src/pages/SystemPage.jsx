import React, { useEffect, useState } from 'react';
import { 
  Server, 
  Database, 
  Activity, 
  RefreshCw, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Terminal,
  Clock,
  Layers,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

export default function SystemPage() {
  const { systemStatus, setSystemStatus, openQueryInspector, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [queryLog, setQueryLog] = useState([]);
  const [queryFilter, setQueryFilter] = useState('all');

  const refreshOverview = () => {
    setLoading(true);
    Promise.all([
      api.getSystemOverview(),
      api.getQueryHistory(50, queryFilter === 'all' ? '' : queryFilter)
    ])
    .then(([sys, qRes]) => {
      setSystemStatus(sys);
      setQueryLog(qRes.queries || []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshOverview();
  }, [queryFilter]);

  const handleReplayOutbox = () => {
    setReplaying(true);
    api.replayOutbox()
      .then(res => {
        addToast(res.message, 'success');
        refreshOverview();
      })
      .catch(err => addToast(err.message, 'error'))
      .finally(() => setReplaying(false));
  };

  const handleRebuildGraph = () => {
    if (!window.confirm("Are you sure you want to rebuild the entire Neo4j graph from MongoDB documents?")) return;

    setRebuilding(true);
    api.rebuildGraph()
      .then(res => {
        if (res.success) {
          addToast(res.message, 'success');
        } else {
          addToast(res.message, 'error');
        }
        refreshOverview();
      })
      .catch(err => addToast(err.message, 'error'))
      .finally(() => setRebuilding(false));
  };

  const handleClearQueries = () => {
    api.clearQueries()
      .then(() => {
        addToast('Query audit log cleared.', 'info');
        setQueryLog([]);
      })
      .catch(console.error);
  };

  const mongo = systemStatus?.mongo;
  const neo = systemStatus?.neo4j;
  const outbox = systemStatus?.outbox;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-mongo" style={{ fontSize: '0.72rem' }}>Engine Telemetry</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Infrastructure Health Check</span>
          </div>
          <h1 className="page-title">Database & System Inspector</h1>
          <p className="page-subtitle">
            Live telemetry diagnostics, connection health, sync outbox resilience, and chronological query execution audit
          </p>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={refreshOverview}
          style={{ padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spinning' : ''} /> <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Database Status Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '2rem', marginBottom: '2.75rem' }}>
        {/* MongoDB Card */}
        <div className="glass-panel" style={{ 
          padding: '2.25rem', 
          borderLeft: '4px solid #10b981',
          borderRadius: 'var(--radius-xl)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ 
                padding: '0.65rem', 
                background: 'var(--mongo-bg)', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
              }}>
                <Database size={22} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>MongoDB Community 8.0</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Document Store • Primary System of Record</p>
              </div>
            </div>

            <span className={`badge ${mongo?.connected ? 'badge-success' : 'badge-mongo'}`} style={{ padding: '0.35rem 0.8rem' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: mongo?.connected ? '#10b981' : '#34d399',
                display: 'inline-block'
              }} />
              {mongo?.connected ? 'Live Connected' : 'In-Memory Engine'}
            </span>
          </div>

          <div style={{
            background: 'rgba(12, 17, 30, 0.65)',
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            border: '1px solid var(--border-medium)',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem',
            marginBottom: '1.45rem'
          }}>
            <div><span style={{ color: 'var(--text-dim)' }}>URI:</span> <code style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{mongo?.uri}</code></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Database:</span> <strong style={{ color: '#fff' }}>{mongo?.database}</strong></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Operating Mode:</span> <strong style={{ color: '#fff' }}>{mongo?.mode}</strong></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Total Documents:</span> <strong style={{ color: '#34d399' }}>{mongo?.total_documents}</strong></div>
          </div>

          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>
            Collection Breakdown (8 Collections):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
            {mongo?.collections && Object.entries(mongo.collections).map(([col, cnt]) => (
              <div key={col} style={{
                padding: '0.55rem 0.85rem',
                background: 'rgba(15, 22, 38, 0.6)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.82rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{col}:</span>
                <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{cnt} docs</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Neo4j Card */}
        <div className="glass-panel" style={{ 
          padding: '2.25rem', 
          borderLeft: '4px solid #06b6d4',
          borderRadius: 'var(--radius-xl)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ 
                padding: '0.65rem', 
                background: 'var(--neo4j-bg)', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
              }}>
                <Layers size={22} color="#06b6d4" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>Neo4j Graph Database</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Index-Free Adjacency • Relationship Brain</p>
              </div>
            </div>

            <span className={`badge ${neo?.connected ? 'badge-success' : 'badge-neo4j'}`} style={{ padding: '0.35rem 0.8rem' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: neo?.connected ? '#06b6d4' : '#38bdf8',
                display: 'inline-block'
              }} />
              {neo?.connected ? 'Live Connected' : 'In-Memory Graph Engine'}
            </span>
          </div>

          <div style={{
            background: 'rgba(12, 17, 30, 0.65)',
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            border: '1px solid var(--border-medium)',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem',
            marginBottom: '1.45rem'
          }}>
            <div><span style={{ color: 'var(--text-dim)' }}>URI:</span> <code style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{neo?.uri}</code></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Database:</span> <strong style={{ color: '#fff' }}>{neo?.database}</strong></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Operating Mode:</span> <strong style={{ color: '#fff' }}>{neo?.mode}</strong></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Graph Topology:</span> <strong style={{ color: '#38bdf8' }}>{neo?.total_nodes} nodes • {neo?.total_relationships} edges</strong></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>
                Nodes by Label:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {neo?.node_counts && Object.entries(neo.node_counts).map(([lbl, cnt]) => (
                  <div key={lbl} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-muted)',
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(15, 22, 38, 0.4)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>(:{lbl})</span>
                    <strong style={{ color: '#fff' }}>{cnt}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>
                Edges by Type:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {neo?.relationship_counts && Object.entries(neo.relationship_counts).map(([rel, cnt]) => (
                  <div key={rel} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-muted)',
                    padding: '0.35rem 0.65rem',
                    background: 'rgba(15, 22, 38, 0.4)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>[:{rel}]</span>
                    <strong style={{ color: '#fff' }}>{cnt}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Outbox Pattern Panel */}
      <div className="glass-panel" style={{ padding: '2.25rem', marginBottom: '2.75rem', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-neutral">Dual-Write Consistency Pattern</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Sync Outbox Queue Engine</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Writes commit to MongoDB first. If the Neo4j graph sync fails, events are preserved in <code>sync_outbox</code> for guaranteed replay.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={replaying}
              onClick={handleReplayOutbox}
              style={{ padding: '0.45rem 0.95rem' }}
            >
              <RotateCcw size={14} className={replaying ? 'spinning' : ''} /> <span>Replay Pending Syncs</span>
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={rebuilding}
              onClick={handleRebuildGraph}
              style={{ padding: '0.45rem 0.95rem' }}
            >
              <RefreshCw size={14} className={rebuilding ? 'spinning' : ''} /> <span>Rebuild Entire Graph from MongoDB</span>
            </button>
          </div>
        </div>

        {/* Outbox Status Counts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Total Outbox Events</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>{outbox?.total || 0}</div>
          </div>
          <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Pending Queue</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: (outbox?.pending || 0) > 0 ? '#fbbf24' : '#fff', marginTop: '0.25rem' }}>
              {outbox?.pending || 0}
            </div>
          </div>
          <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Successfully Synced</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
              {outbox?.synced || 0}
            </div>
          </div>
          <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Failed Sync Events</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: (outbox?.failed || 0) > 0 ? '#fb7185' : 'var(--text-muted)', marginTop: '0.25rem' }}>
              {outbox?.failed || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Query History Audit Log */}
      <div className="glass-panel" style={{ padding: '2.25rem', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Live Session Query History Audit</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Chronological audit log of database queries dispatched across your interaction session
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['all', 'mongodb', 'neo4j'].map(type => (
                <button
                  key={type}
                  className={`btn btn-sm ${queryFilter === type ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ textTransform: 'capitalize', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem' }}
                  onClick={() => setQueryFilter(type)}
                >
                  {type === 'all' ? 'All Engines' : type === 'mongodb' ? 'MongoDB' : 'Neo4j'}
                </button>
              ))}
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearQueries}
              title="Clear query history log"
              style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem' }}
            >
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>

        {/* Query Log Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '450px', overflowY: 'auto' }}>
          {queryLog.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2.5rem' }}>
              No queries logged for this session yet.
            </p>
          ) : (
            queryLog.map((item, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '1.15rem',
                  cursor: 'pointer',
                  borderLeft: `4px solid ${item.database === 'MongoDB' ? '#10b981' : '#06b6d4'}`,
                  borderRadius: 'var(--radius-md)'
                }}
                onClick={() => openQueryInspector(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <span className={`badge ${item.database === 'MongoDB' ? 'badge-mongo' : 'badge-neo4j'}`} style={{ fontSize: '0.72rem' }}>
                      {item.database}
                    </span>
                    <strong style={{ fontSize: '0.86rem', color: '#fff' }}>{item.operation}</strong>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
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
    </div>
  );
}
