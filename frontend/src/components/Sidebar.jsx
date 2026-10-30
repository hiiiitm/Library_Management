import React from 'react';
import {
  LayoutDashboard, 
  BookOpen, 
  Repeat, 
  Users, 
  Sparkles, 
  Share2, 
  BarChart3, 
  Server, 
  BookPlus,
  Shield,
  User
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { activeTab, setActiveTab, role, activeMember, systemStatus } = useApp();

  const coreItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalogue', label: 'Book Catalogue', icon: BookOpen },
    { id: 'circulation', label: 'Circulation Desk', icon: Repeat, librarianOnly: true },
    { id: 'members', label: 'Members Directory', icon: Users },
    { id: 'manage_books', label: 'Manage Inventory', icon: BookPlus, librarianOnly: true },
  ];

  const intelligenceItems = [
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles, badge: 'Neo4j' },
    { id: 'graph_explorer', label: 'Graph Explorer', icon: Share2, badge: 'Neo4j' },
    { id: 'analytics', label: 'Analytics & Pipelines', icon: BarChart3, badge: 'MongoDB' },
    { id: 'system', label: 'System & Diagnostics', icon: Server }
  ];

  const renderNavButton = (item) => {
    if (item.librarianOnly && role === 'member') {
      return null;
    }

    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid',
          borderColor: isActive ? 'rgba(138, 78, 242, 0.55)' : 'transparent',
          background: isActive 
            ? 'linear-gradient(135deg, rgba(138, 78, 242, 0.28) 0%, rgba(0, 150, 255, 0.18) 100%)' 
            : 'transparent',
          color: isActive ? '#ffffff' : 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '0.92rem',
          fontWeight: isActive ? 700 : 500,
          transition: 'all 0.25s cubic-bezier(0.18, 1, 0.2, 1)',
          textAlign: 'left',
          position: 'relative',
          boxShadow: isActive ? '0 6px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.transform = 'translateX(6px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.transform = 'translateX(0)';
          }
        }}
      >
        {isActive && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '22%',
            bottom: '22%',
            width: '4px',
            borderRadius: '0 6px 6px 0',
            background: 'linear-gradient(180deg, var(--accent-gold) 0%, var(--accent-primary) 100%)',
            boxShadow: '0 0 18px var(--accent-gold)'
          }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{
            color: isActive ? '#d4af37' : 'currentColor',
            filter: isActive ? 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.7))' : 'none',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Icon size={20} />
          </div>
          <span>{item.label}</span>
        </div>

        {item.badge && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            background: item.badge === 'MongoDB' 
              ? 'linear-gradient(135deg, rgba(0, 196, 154, 0.22) 0%, rgba(0, 120, 100, 0.12) 100%)' 
              : 'linear-gradient(135deg, rgba(0, 150, 255, 0.22) 0%, rgba(0, 100, 180, 0.12) 100%)',
            color: item.badge === 'MongoDB' ? '#5adfb5' : '#4da6ff',
            border: `1px solid ${item.badge === 'MongoDB' ? 'rgba(0, 196, 154, 0.45)' : 'rgba(0, 150, 255, 0.45)'}`,
            boxShadow: item.badge === 'MongoDB' ? '0 0 14px var(--mongo-glow)' : '0 0 14px var(--neo4j-glow)'
          }}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside style={{
      width: '295px',
      background: 'rgba(10, 15, 25, 0.96)',
      backdropFilter: 'blur(28px)',
      borderRight: '1px solid var(--border-medium)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '2rem 1.5rem',
      flexShrink: 0
    }}>
      <div>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          padding: '0 1rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Operations & Desk</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--accent-gold)' }}>◆ CORE</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '2.2rem' }}>
          {coreItems.map(renderNavButton)}
        </nav>

        <div style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          padding: '0 1rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>NoSQL Intelligence</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--accent-secondary)' }}>◆ DUAL-DB</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {intelligenceItems.map(renderNavButton)}
        </nav>
      </div>

      <div className="glass-panel" style={{ 
        padding: '1.25rem 1.4rem', 
        background: 'linear-gradient(135deg, rgba(22, 30, 50, 0.88) 0%, rgba(34, 46, 72, 0.7) 100%)',
        border: '1px solid var(--border-medium)',
        borderTop: '1px solid rgba(255, 255, 255, 0.28)',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: role === 'librarian' 
              ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-purple) 100%)' 
              : 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-sky) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: role === 'librarian' 
              ? '0 0 22px var(--accent-primary-glow)' 
              : '0 0 22px var(--accent-secondary-glow)',
            flexShrink: 0
          }}>
            {role === 'librarian' ? <Shield size={22} /> : <User size={22} />}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ 
              fontWeight: 800, 
              fontSize: '0.92rem', 
              color: '#ffffff', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              {role === 'librarian' ? 'Chief Librarian' : (activeMember?.name || 'Aarav Sharma')}
            </div>
            <div style={{ 
              fontSize: '0.72rem', 
              color: 'var(--text-muted)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              marginTop: '0.18rem' 
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--mongo-color)',
                boxShadow: '0 0 8px var(--mongo-color)'
              }}></span>
              {role === 'librarian' ? 'Librarian Console' : `ID: ${activeMember?.member_id || 'M0004'}`}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}