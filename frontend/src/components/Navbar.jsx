import React, { useEffect } from 'react';
import { 
  Terminal, 
  ShieldCheck, 
  UserCheck, 
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { 
    role, 
    setRole, 
    membersList, 
    activeMemberId, 
    changeActiveMember, 
    activeMember,
    systemStatus,
    openQueryInspector
  } = useApp();

  const mongoOk = systemStatus?.mongo?.connected;
  const neoOk = systemStatus?.neo4j?.connected;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openQueryInspector({
          database: 'MongoDB',
          operation: 'Session Audit',
          query_text: '// Live Database Query Inspector activated via shortcut (Ctrl+K).\n// Click "Active Query" or "Query History" to inspect executed NoSQL operations.',
          purpose: 'Real-time telemetry and polyglot persistence query auditor.',
          execution_ms: 0.0
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openQueryInspector]);

  return (
    <header style={{
      height: '80px',
      borderBottom: '1px solid var(--border-medium)',
      background: 'rgba(10, 15, 25, 0.92)',
      backdropFilter: 'blur(28px) saturate(200%)',
      WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 3rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 6px 30px rgba(0, 0, 0, 0.6)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 28px rgba(138, 78, 242, 0.52)',
            border: '1px solid rgba(255, 255, 255, 0.32)'
          }}>
            <Layers size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ 
              fontWeight: 850, 
              fontSize: '1.4rem', 
              letterSpacing: '-0.04em', 
              color: '#ffffff',
              lineHeight: 1.1
            }}>
              Nex<span style={{ 
                background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Lib</span>
            </div>
            <div style={{ 
              fontSize: '0.7rem', 
              color: 'var(--text-dim)', 
              letterSpacing: '0.11em', 
              textTransform: 'uppercase',
              fontWeight: 700,
              marginTop: '0.18rem'
            }}>
              Polyglot NoSQL Engine
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            className="badge badge-mongo" 
            style={{ 
              padding: '0.4rem 1rem',
              fontSize: '0.78rem',
              gap: '0.6rem',
              boxShadow: '0 0 22px var(--mongo-glow)'
            }}
            title={systemStatus?.mongo?.mode || 'MongoDB System of Record'}
          >
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--mongo-color)',
              display: 'inline-block',
              animation: 'pulseRadar 1.8s infinite'
            }}></span>
            <span style={{ fontWeight: 700 }}>MongoDB</span>
            <span style={{ opacity: 0.88, fontSize: '0.74rem' }}>
              {mongoOk ? 'Online' : 'Active'}
            </span>
          </div>

          <div 
            className="badge badge-neo4j" 
            style={{ 
              padding: '0.4rem 1rem',
              fontSize: '0.78rem',
              gap: '0.6rem',
              boxShadow: '0 0 22px var(--neo4j-glow)'
            }}
            title={systemStatus?.neo4j?.mode || 'Neo4j Graph Brain'}
          >
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--neo4j-color)',
              display: 'inline-block',
              animation: 'pulseRadarCyan 1.8s infinite'
            }}></span>
            <span style={{ fontWeight: 700 }}>Neo4j</span>
            <span style={{ opacity: 0.88, fontSize: '0.74rem' }}>
              {neoOk ? 'Online' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(26, 36, 52, 0.88)',
          padding: '0.38rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'inset 0 1px 5px rgba(0, 0, 0, 0.65)'
        }}>
          <button
            onClick={() => setRole('librarian')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.52rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: role === 'librarian' 
                ? 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)' 
                : 'transparent',
              color: role === 'librarian' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: role === 'librarian' ? '0 0 22px var(--accent-primary-glow)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <ShieldCheck size={16} />
            <span>Chief Librarian</span>
          </button>

          <button
            onClick={() => setRole('member')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.52rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: role === 'member' 
                ? 'linear-gradient(135deg, var(--accent-secondary) 0%, #0284c7 100%)' 
                : 'transparent',
              color: role === 'member' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: role === 'member' ? '0 0 22px var(--accent-secondary-glow)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <UserCheck size={16} />
            <span>Member View</span>
          </button>
        </div>

        {role === 'member' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <select
              className="form-control"
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: '0.82rem', 
                width: '220px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(20, 28, 42, 0.98)',
                borderColor: 'var(--border-medium)'
              }}
              value={activeMemberId}
              onChange={(e) => changeActiveMember(e.target.value)}
            >
              {membersList.slice(0, 30).map(m => (
                <option key={m.member_id} value={m.member_id}>
                  {m.member_id}: {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => openQueryInspector({
            database: 'MongoDB',
            operation: 'Session Audit',
            query_text: '// Click any "Show Query" badge across the application to audit executed queries live.\n// Or use Ctrl+K anytime to open this modal.',
            purpose: 'Interactive polyglot database query inspector for live project defense.',
            execution_ms: 0.0
          })}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            borderColor: 'var(--border-glow)',
            background: 'linear-gradient(135deg, rgba(138, 78, 242, 0.18) 0%, rgba(0, 150, 255, 0.12) 100%)',
            padding: '0.5rem 1.15rem',
            boxShadow: '0 0 22px var(--accent-primary-glow)'
          }}
          title="Inspect live database queries (Shortcut: Ctrl+K)"
        >
          <Terminal size={16} color="#818cf8" />
          <span style={{ fontWeight: 700 }}>Query Inspector</span>
          <span style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            padding: '0.12rem 0.45rem',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(26, 36, 52, 0.85)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-medium)'
          }}>
            Ctrl+K
          </span>
        </button>
      </div>
    </header>
  );
}