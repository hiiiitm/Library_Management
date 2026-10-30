import React, { useEffect, useState } from 'react';
import { 
  Repeat, 
  RotateCcw, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  IndianRupee, 
  ArrowRight,
  UserCheck,
  Bookmark,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import QueryBadge from '../components/QueryBadge';

export default function CirculationPage() {
  const { addToast } = useApp();

  const [activeTab, setActiveTab] = useState('loans'); // 'loans' | 'checkout' | 'reservations'
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [members, setMembers] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchMember, setSearchMember] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeQuery, setActiveQuery] = useState(null);

  // Form states for checkout
  const [checkoutMemberId, setCheckoutMemberId] = useState('');
  const [checkoutBookId, setCheckoutBookId] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const loadLoans = () => {
    setLoading(true);
    api.getLoans({ status: statusFilter, member_id: searchMember })
      .then(res => {
        setLoans(res.loans || []);
        setActiveQuery(res.query);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadReservations = () => {
    api.getReservations()
      .then(res => setReservations(res.reservations || []))
      .catch(console.error);
  };

  useEffect(() => {
    loadLoans();
  }, [statusFilter, searchMember]);

  useEffect(() => {
    // Load members and books for checkout picker
    api.getMembers({ limit: 150 }).then(res => {
      setMembers(res.members || []);
      if (res.members?.[0]) setCheckoutMemberId(res.members[0].member_id);
    });

    api.getBooks({ available_only: true, limit: 100 }).then(res => {
      setAvailableBooks(res.books || []);
      if (res.books?.[0]) setCheckoutBookId(res.books[0].book_id);
    });

    loadReservations();
  }, []);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!checkoutBookId || !checkoutMemberId) return;

    setCheckoutSubmitting(true);
    api.checkoutBook(checkoutBookId, checkoutMemberId)
      .then(res => {
        addToast(res.message, 'success');
        setActiveQuery(res.query);
        loadLoans();
        api.getBooks({ available_only: true, limit: 100 }).then(r => setAvailableBooks(r.books || []));
        setActiveTab('loans');
      })
      .catch(err => {
        addToast(err.message, 'error');
      })
      .finally(() => setCheckoutSubmitting(false));
  };

  const handleReturn = (loanId) => {
    api.returnBook(loanId)
      .then(res => {
        addToast(res.message, 'success');
        setActiveQuery(res.query);
        loadLoans();
      })
      .catch(err => addToast(err.message, 'error'));
  };

  const handleRenew = (loanId) => {
    api.renewLoan(loanId)
      .then(res => {
        addToast(res.message, 'success');
        setActiveQuery(res.query);
        loadLoans();
      })
      .catch(err => addToast(err.message, 'error'));
  };

  const handlePayFine = (loanId) => {
    api.payFine(loanId)
      .then(res => {
        addToast(res.message, 'success');
        loadLoans();
      })
      .catch(err => addToast(err.message, 'error'));
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-mongo" style={{ fontSize: '0.72rem' }}>Atomic Concurrency Control</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Chief Librarian Workbench</span>
          </div>
          <h1 className="page-title">Circulation Desk</h1>
          <p className="page-subtitle">
            Manage checkouts, atomic returns, loan renewals, and overdue fine settlements with zero race condition guarantees
          </p>
        </div>

        {activeQuery && <QueryBadge query={activeQuery} />}
      </div>

      {/* Navigation tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.85rem', 
        marginBottom: '2.25rem',
        background: 'rgba(12, 17, 30, 0.75)',
        padding: '0.35rem',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-medium)',
        width: 'fit-content'
      }}>
        <button
          className={`btn btn-sm`}
          style={{
            borderRadius: 'var(--radius-full)',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 700,
            padding: '0.5rem 1.15rem',
            background: activeTab === 'loans' ? 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' : 'transparent',
            color: activeTab === 'loans' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeTab === 'loans' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none'
          }}
          onClick={() => setActiveTab('loans')}
        >
          <Repeat size={15} /> Active Circulation
        </button>
        <button
          className={`btn btn-sm`}
          style={{
            borderRadius: 'var(--radius-full)',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 700,
            padding: '0.5rem 1.15rem',
            background: activeTab === 'checkout' ? 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' : 'transparent',
            color: activeTab === 'checkout' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeTab === 'checkout' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none'
          }}
          onClick={() => setActiveTab('checkout')}
        >
          <UserCheck size={15} /> Issue New Loan (Atomic)
        </button>
        <button
          className={`btn btn-sm`}
          style={{
            borderRadius: 'var(--radius-full)',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 700,
            padding: '0.5rem 1.15rem',
            background: activeTab === 'reservations' ? 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' : 'transparent',
            color: activeTab === 'reservations' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeTab === 'reservations' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none'
          }}
          onClick={() => {
            setActiveTab('reservations');
            loadReservations();
          }}
        >
          <Bookmark size={15} /> Holds Queue ({reservations.length})
        </button>
      </div>

      {/* TAB 1: CIRCULATION LOANS LIST */}
      {activeTab === 'loans' && (
        <div>
          {/* Filter Bar */}
          <div className="glass-panel" style={{ 
            padding: '1.25rem 1.75rem', 
            marginBottom: '1.75rem', 
            display: 'flex', 
            gap: '1.25rem', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            borderRadius: 'var(--radius-xl)'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['active', 'overdue', 'returned', 'all'].map(st => (
                <button
                  key={st}
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(st)}
                  style={{ textTransform: 'capitalize', borderRadius: 'var(--radius-full)' }}
                >
                  {st} Loans
                </button>
              ))}
            </div>

            <div style={{ flex: '1 1 220px', maxWidth: '340px', position: 'relative' }}>
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Filter by Member ID (e.g. M0004)..."
                style={{ paddingLeft: '2.5rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
              />
            </div>
          </div>

          {/* Loans Table */}
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Book Title</th>
                  <th>Member ID</th>
                  <th>Issued Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Renewals</th>
                  <th>Late Fine</th>
                  <th style={{ textAlign: 'right' }}>Circulation Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      No circulation records found matching active filter.
                    </td>
                  </tr>
                ) : (
                  loans.map(l => {
                    const isOverdue = l.status === 'overdue';
                    const isReturned = l.status === 'returned';
                    const hasFine = (l.fine_amount || 0) > 0;

                    return (
                      <tr key={l.loan_id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#93c5fd', fontWeight: 600 }}>
                          {l.loan_id}
                        </td>
                        <td style={{ fontWeight: 600, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.book_title}
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{l.book_id}</div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                          {l.member_id}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {l.issued_at?.slice(0, 10)}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: isOverdue ? '#fda4af' : 'var(--text-main)', fontWeight: isOverdue ? 700 : 400 }}>
                          {l.due_at?.slice(0, 10)}
                        </td>
                        <td>
                          <span className={`badge ${isReturned ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-neo4j'}`}>
                            {l.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {l.renewals || 0} / 2
                        </td>
                        <td>
                          {hasFine ? (
                            <span className="badge badge-danger" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              Rs. {l.fine_amount?.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Rs. 0.00</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            {!isReturned && (
                              <>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleReturn(l.loan_id)}
                                  title="Return book and atomically increment inventory"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                >
                                  Return
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleRenew(l.loan_id)}
                                  disabled={(l.renewals || 0) >= 2}
                                  title="Extend loan by 14 days"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                >
                                  Renew
                                </button>
                              </>
                            )}
                            {hasFine && (
                              <button
                                className="btn btn-sm"
                                style={{ background: 'rgba(245, 158, 11, 0.22)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.45)', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                onClick={() => handlePayFine(l.loan_id)}
                                title="Settle overdue fine"
                              >
                                Settle Fine
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ATOMIC CHECKOUT FORM */}
      {activeTab === 'checkout' && (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
                <span className="badge badge-mongo">MongoDB Atomic findOneAndUpdate</span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Issue Book to Member</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Guarantees zero race conditions via single-document <code>findOneAndUpdate</code> with condition <code>available_copies &gt; 0</code>.
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              <div style={{ marginBottom: '1.65rem' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Select Member
                </label>
                <select
                  className="form-control"
                  required
                  value={checkoutMemberId}
                  onChange={(e) => setCheckoutMemberId(e.target.value)}
                >
                  {members.map(m => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.member_id}: {m.name} ({m.membership_type.toUpperCase()} • Max {m.max_loans} loans)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.65rem' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Select Available Book ({availableBooks.length} available)
                </label>
                <select
                  className="form-control"
                  required
                  value={checkoutBookId}
                  onChange={(e) => setCheckoutBookId(e.target.value)}
                >
                  {availableBooks.map(b => (
                    <option key={b.book_id} value={b.book_id}>
                      {b.book_id}: {b.title} ({b.available_copies} of {b.total_copies} left)
                    </option>
                  ))}
                </select>
              </div>

              {/* Policy Checklist */}
              <div style={{
                background: 'rgba(12, 17, 30, 0.65)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid var(--border-medium)',
                marginBottom: '1.75rem',
                fontSize: '0.84rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} color="#34d399" />
                  Circulation Policies Enforced:
                </div>
                <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7 }}>
                  <li>Standard 14-day circulation window applied automatically.</li>
                  <li>Max active loans: 5 for standard students, 8 for faculty/researchers.</li>
                  <li>Checkouts blocked if member unpaid balance exceeds Rs. 50.00.</li>
                  <li>Duplicate active loans of the exact same title prohibited.</li>
                  <li>Asynchronously creates <code>(Member)-[:BORROWED]-&gt;(Book)</code> edge in Neo4j graph.</li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={checkoutSubmitting}
                style={{ width: '100%', padding: '0.95rem', fontSize: '0.95rem' }}
              >
                {checkoutSubmitting ? 'Validating Atomic Constraints...' : 'Confirm Atomic Checkout'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: RESERVATIONS QUEUE */}
      {activeTab === 'reservations' && (
        <div className="glass-panel" style={{ padding: '1.75rem', overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ marginBottom: '1.45rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Book Reservation Queue</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Hold requests placed on high-demand titles when physical copies reached 0</p>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Reservation ID</th>
                <th>Book Title</th>
                <th>Book ID</th>
                <th>Member</th>
                <th>Reserved Date</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No active hold reservations currently recorded.
                  </td>
                </tr>
              ) : (
                reservations.map(r => (
                  <tr key={r.reservation_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#93c5fd' }}>{r.reservation_id}</td>
                    <td style={{ fontWeight: 600 }}>{r.book_title}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{r.book_id}</td>
                    <td>{r.member_name} ({r.member_id})</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.reserved_at?.slice(0, 10)}</td>
                    <td><span className="badge badge-neutral">Priority {r.priority}</span></td>
                    <td>
                      <span className={`badge ${r.status === 'fulfilled' ? 'badge-success' : r.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
