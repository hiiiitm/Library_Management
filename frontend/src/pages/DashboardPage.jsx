import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Repeat, 
  AlertTriangle, 
  Users, 
  IndianRupee, 
  TrendingUp, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  Clock,
  Shield,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import KpiCard from '../components/KpiCard';
import BookCard from '../components/BookCard';
import QueryBadge from '../components/QueryBadge';

export default function DashboardPage() {
  const { setActiveTab, navigateToBook, role, activeMember } = useApp();
  const [kpis, setKpis] = useState(null);
  const [recentOverdue, setRecentOverdue] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDashboardKpi(),
      api.getLoans({ status: 'overdue', limit: 5 }),
      api.getBooks({ sort_by: 'popularity_desc', limit: 4 })
    ])
    .then(([kpiData, overdueData, booksData]) => {
      setKpis(kpiData);
      setRecentOverdue(overdueData.loans || []);
      setTopBooks(booksData.books || []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-mongo" style={{ fontSize: '0.72rem' }}>Document Store</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>•</span>
            <span className="badge badge-neo4j" style={{ fontSize: '0.72rem' }}>Graph Traversal</span>
          </div>
          <h1 className="page-title">Library Overview & Operations</h1>
          <p className="page-subtitle">
            Synchronized Polyglot System: MongoDB (Transactional System of Record) + Neo4j (Relationship & Graph Brain)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('recommendations')}
          >
            <Sparkles size={15} color="#38bdf8" />
            <span>Recommendation Hub</span>
          </button>
          {role === 'librarian' && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('circulation')}
            >
              <Repeat size={15} />
              <span>Circulation Desk</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.45rem',
        marginBottom: '2.5rem'
      }}>
        <KpiCard
          title="Catalogued Titles"
          value={kpis?.total_books ?? '...'}
          subvalue={`${kpis?.available_copies ?? 0} physical copies available`}
          icon={BookOpen}
          accent="indigo"
          query={kpis?.queries?.[0]}
        />
        <KpiCard
          title="Circulating Copies"
          value={kpis?.active_loans ?? '...'}
          subvalue="Currently active loans"
          icon={Repeat}
          accent="cyan"
          query={kpis?.queries?.[2]}
        />
        <KpiCard
          title="Overdue Notices"
          value={kpis?.overdue_loans ?? '...'}
          subvalue="Requires circulation recall"
          icon={AlertTriangle}
          accent="rose"
        />
        <KpiCard
          title="Registered Members"
          value={kpis?.total_members ?? '...'}
          subvalue="Students, faculty & researchers"
          icon={Users}
          accent="purple"
          query={kpis?.queries?.[1]}
        />
        <KpiCard
          title="Unpaid Balance"
          value={`Rs. ${kpis?.total_fines_due?.toFixed(2) ?? '0.00'}`}
          subvalue={`Rs. ${kpis?.total_fines_collected?.toFixed(2) ?? '0.00'} collected`}
          icon={TrendingUp}
          accent="amber"
        />
      </div>

      {/* Main Grid: High-Circulation Titles + Overdue Attention */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', 
        gap: '2.25rem', 
        marginBottom: '2.75rem' 
      }}>
        {/* Most Borrowed Titles */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.45rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>High-Circulation Titles</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Top books ranked by borrowing frequency & reader score</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('catalogue')}
            >
              <span>View All</span> <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
            {topBooks.map(b => (
              <BookCard key={b.book_id} book={b} onSelect={() => navigateToBook(b.book_id)} />
            ))}
          </div>
        </div>

        {/* Overdue Attention Table */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.45rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertTriangle size={20} color="#fb7185" /> 
                <span>Overdue Attention Queue</span>
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Past 14-day circulation window (Automatic fine: Rs. 2.00 / day)
              </p>
            </div>
            {role === 'librarian' && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('circulation')}
              >
                <span>Circulation Desk</span> <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Book Title</th>
                  <th>Member</th>
                  <th>Due Date</th>
                  <th>Calculated Fine</th>
                </tr>
              </thead>
              <tbody>
                {recentOverdue.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                      <CheckCircle2 size={32} color="#10b981" style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
                      <div>All circulation records are up to date. No overdue accounts!</div>
                    </td>
                  </tr>
                ) : (
                  recentOverdue.map(l => (
                    <tr key={l.loan_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#93c5fd', fontWeight: 600 }}>
                        {l.loan_id}
                      </td>
                      <td style={{ fontWeight: 600, maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.book_title}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {l.member_id}
                      </td>
                      <td style={{ color: '#fda4af', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                        {l.due_at?.slice(0, 10)}
                      </td>
                      <td>
                        <span className="badge badge-danger" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          Rs. {l.fine_amount?.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Polyglot Architecture Callout Card */}
      <div className="glass-panel" style={{
        padding: '1.75rem 2.25rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(99, 102, 241, 0.06) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderTop: '1px solid rgba(255, 255, 255, 0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
            <span className="badge badge-mongo">MongoDB Atomic Document Model</span>
            <span style={{ color: 'var(--text-dim)' }}>+</span>
            <span className="badge badge-neo4j">Neo4j Index-Free Adjacency</span>
          </div>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.45rem', color: '#ffffff' }}>
            Polyglot Persistence: Specialized Engines for Distributed Workloads
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Every book circulation triggers atomic single-document operations in MongoDB, followed by asynchronous sync outbox projections into Neo4j graph nodes and edges. Click any <strong>"Show Query"</strong> badge across the platform to inspect live database syntax and execution latency.
          </p>
        </div>

        <button 
          className="btn btn-secondary"
          onClick={() => setActiveTab('analytics')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <span>Explore Aggregations</span> <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
