import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import QueryBadge from '../components/QueryBadge';

export default function MembersPage() {
  const { navigateToBook, addToast } = useApp();

  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeQuery, setActiveQuery] = useState(null);

  // Selected member profile state
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [memberRecs, setMemberRecs] = useState([]);
  const [recsQuery, setRecsQuery] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add Member Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState('student');

  const loadMembers = () => {
    setLoading(true);
    api.getMembers({ search, role: roleFilter, limit: 60 })
      .then(res => {
        setMembers(res.members || []);
        setTotal(res.total || 0);
        setActiveQuery(res.query);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, [search, roleFilter]);

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setDetailLoading(true);
    Promise.all([
      api.getMemberDetail(member.member_id),
      api.getPersonalizedRecommendations(member.member_id, 4)
    ])
    .then(([dRes, recRes]) => {
      setMemberDetail(dRes);
      setMemberRecs(recRes.recommendations || []);
      setRecsQuery(recRes.query);
    })
    .catch(console.error)
    .finally(() => setDetailLoading(false));
  };

  const handleCreateMember = (e) => {
    e.preventDefault();
    api.createMember({
      name: newName,
      email: newEmail,
      phone: newPhone,
      membership_type: newType,
      role: 'member',
      favorite_genres: ['Fiction', 'Classics']
    })
    .then(res => {
      addToast(`Member ${res.member.name} registered successfully!`, 'success');
      setAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      loadMembers();
    })
    .catch(err => addToast(err.message, 'error'));
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-mongo" style={{ fontSize: '0.72rem' }}>PII Confidential Store</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Patron Access Management</span>
          </div>
          <h1 className="page-title">Members Directory</h1>
          <p className="page-subtitle">
            Manage patrons, view individual loan histories, and generate real-time Neo4j collaborative reading affinities
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          {activeQuery && <QueryBadge query={activeQuery} />}
          <button className="btn btn-primary btn-sm" onClick={() => setAddModalOpen(true)}>
            <UserPlus size={15} /> <span>Register Member</span>
          </button>
        </div>
      </div>

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
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by patron name, email, or member ID..."
            style={{ paddingLeft: '2.6rem', borderRadius: 'var(--radius-full)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${roleFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setRoleFilter('all')}
          >
            All Members ({total})
          </button>
          <button
            className={`btn btn-sm ${roleFilter === 'member' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setRoleFilter('member')}
          >
            Patrons
          </button>
          <button
            className={`btn btn-sm ${roleFilter === 'librarian' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setRoleFilter('librarian')}
          >
            Librarians
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Membership Tier</th>
              <th>Role</th>
              <th>Max Loans</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr 
                key={m.member_id}
                onClick={() => handleSelectMember(m)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#93c5fd', fontWeight: 600 }}>
                  {m.member_id}
                </td>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#fff'
                    }}>
                      {m.name?.charAt(0) || 'M'}
                    </div>
                    <span>{m.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                  {m.email}
                </td>
                <td>
                  <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                    {m.membership_type}
                  </span>
                </td>
                <td>
                  {m.role === 'librarian' ? (
                    <span className="badge badge-mongo">
                      <ShieldCheck size={12} /> Librarian
                    </span>
                  ) : (
                    <span className="badge badge-neutral">Patron</span>
                  )}
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Up to {m.max_loans}
                </td>
                <td>
                  <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {m.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMember(m);
                    }}
                    style={{ padding: '0.35rem 0.85rem' }}
                  >
                    <span>Profile</span> <ArrowRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Member Profile Drawer Modal */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: '820px', borderRadius: 'var(--radius-xl)' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.75rem',
              borderBottom: '1px solid var(--border-medium)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: 'rgba(12, 17, 30, 0.75)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
                  <span className="badge badge-mongo" style={{ fontFamily: 'var(--font-mono)' }}>{selectedMember.member_id}</span>
                  <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{selectedMember.membership_type}</span>
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff' }}>{selectedMember.name}</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem' }}>
                  <span><Mail size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />{selectedMember.email}</span>
                  <span><Phone size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />{selectedMember.phone}</span>
                </p>
              </div>

              <button 
                onClick={() => setSelectedMember(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.75rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {detailLoading ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2.5rem' }}>Loading patron profile...</p>
              ) : (
                <div>
                  {/* Stats Ribbon */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1.25rem',
                    marginBottom: '2rem'
                  }}>
                    <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Active Checkouts</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>{memberDetail?.active_loans?.length || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Lifetime Borrowed</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '0.25rem' }}>{memberDetail?.total_borrowed || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Unpaid Overdue Fines</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (memberDetail?.unpaid_fines || 0) > 0 ? '#fb7185' : '#34d399', marginTop: '0.25rem' }}>
                        Rs. {memberDetail?.unpaid_fines?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>

                  {/* Personalized Neo4j Recommendations for this Member */}
                  <div style={{ marginBottom: '2.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={18} color="#06b6d4" />
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Personalized Neo4j Graph Recommendations</h4>
                      </div>
                      {recsQuery && <QueryBadge query={recsQuery} />}
                    </div>

                    {memberRecs.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        No personalized graph recommendations available yet.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                        {memberRecs.map(rec => (
                          <div 
                            key={rec.book_id}
                            className="glass-panel"
                            onClick={() => {
                              setSelectedMember(null);
                              navigateToBook(rec.book_id);
                            }}
                            style={{ padding: '1.15rem', cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}
                          >
                            <h5 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.35rem', color: '#fff' }}>{rec.title}</h5>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rec.genres?.join(', ')}</div>
                            <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '0.45rem', fontWeight: 600 }}>
                              {rec.why}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Loans */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.85rem' }}>Currently Active Loans</h4>
                    {memberDetail?.active_loans?.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No active loans currently checked out.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {memberDetail?.active_loans?.map(l => (
                          <div key={l.loan_id} style={{
                            padding: '0.85rem 1.15rem',
                            background: 'rgba(15, 23, 42, 0.55)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <strong style={{ fontSize: '0.92rem', color: '#fff' }}>{l.book_title}</strong>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                                Due: {l.due_at?.slice(0, 10)}
                              </div>
                            </div>
                            <span className={`badge ${l.status === 'overdue' ? 'badge-danger' : 'badge-neo4j'}`}>
                              {l.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {addModalOpen && (
        <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px', borderRadius: 'var(--radius-xl)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.45rem 1.75rem', borderBottom: '1px solid var(--border-medium)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Register New Member</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Create a patron record in the MongoDB System of Record</p>
            </div>
            <form onSubmit={handleCreateMember} style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="ramesh.kulkarni@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
                  Membership Tier
                </label>
                <select
                  className="form-control"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  <option value="student">Student (Max 5 Loans)</option>
                  <option value="standard">Standard (Max 5 Loans)</option>
                  <option value="faculty">Faculty (Max 8 Loans)</option>
                  <option value="premium">Premium (Max 8 Loans)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
