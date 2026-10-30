import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Layers, 
  ArrowRight,
  UserCheck,
  Star,
  Compass,
  Cpu,
  Share2
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import QueryBadge from '../components/QueryBadge';
import BookCard from '../components/BookCard';

export default function RecommendationsPage() {
  const { navigateToBook, activeMemberId } = useApp();

  const [mode, setMode] = useState('member'); // 'member' | 'book' | 'genres'
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);

  // Selected targets
  const [selectedMemberId, setSelectedMemberId] = useState(activeMemberId || 'M0004');
  const [selectedBookId, setSelectedBookId] = useState('B0001');

  // Results
  const [memberRecs, setMemberRecs] = useState([]);
  const [memberQuery, setMemberQuery] = useState(null);

  const [alsoBorrowed, setAlsoBorrowed] = useState([]);
  const [alsoQuery, setAlsoQuery] = useState(null);

  const [similarGenres, setSimilarGenres] = useState([]);
  const [similarQuery, setSimilarQuery] = useState(null);

  const [genreRanking, setGenreRanking] = useState([]);
  const [genreQuery, setGenreQuery] = useState(null);

  const [loading, setLoading] = useState(false);

  // Initial load
  useEffect(() => {
    api.getMembers({ limit: 100 }).then(res => setMembers(res.members || []));
    api.getBooks({ limit: 100 }).then(res => setBooks(res.books || []));
    api.getGenrePopularity().then(res => {
      setGenreRanking(res.genres || []);
      setGenreQuery(res.query);
    });
  }, []);

  // Fetch Member-based recs
  useEffect(() => {
    if (mode === 'member' && selectedMemberId) {
      setLoading(true);
      api.getPersonalizedRecommendations(selectedMemberId, 8)
        .then(res => {
          setMemberRecs(res.recommendations || []);
          setMemberQuery(res.query);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [mode, selectedMemberId]);

  // Fetch Book-based recs
  useEffect(() => {
    if (mode === 'book' && selectedBookId) {
      setLoading(true);
      Promise.all([
        api.getAlsoBorrowed(selectedBookId, 6),
        api.getSimilarGenres(selectedBookId, 6)
      ])
      .then(([alsoRes, simRes]) => {
        setAlsoBorrowed(alsoRes.recommendations || []);
        setAlsoQuery(alsoRes.query);
        setSimilarGenres(simRes.similar_books || []);
        setSimilarQuery(simRes.query);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [mode, selectedBookId]);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-neo4j" style={{ fontSize: '0.72rem' }}>Index-Free Adjacency</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Collaborative Filtering</span>
          </div>
          <h1 className="page-title">Neo4j Recommendation Intelligence Hub</h1>
          <p className="page-subtitle">
            Graph traversal algorithms: Real-time collaborative filtering, reader cluster overlapping, and content-based multi-genre similarity
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(12, 17, 30, 0.8)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
        }}>
          <button
            className={`btn btn-sm`}
            style={{
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '0.45rem 1rem',
              background: mode === 'member' ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' : 'transparent',
              color: mode === 'member' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: mode === 'member' ? '0 2px 10px rgba(6, 182, 212, 0.4)' : 'none'
            }}
            onClick={() => setMode('member')}
          >
            <UserCheck size={15} /> Member Affinity
          </button>
          <button
            className={`btn btn-sm`}
            style={{
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '0.45rem 1rem',
              background: mode === 'book' ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' : 'transparent',
              color: mode === 'book' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: mode === 'book' ? '0 2px 10px rgba(6, 182, 212, 0.4)' : 'none'
            }}
            onClick={() => setMode('book')}
          >
            <BookOpen size={15} /> Book Neighborhood
          </button>
          <button
            className={`btn btn-sm`}
            style={{
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '0.45rem 1rem',
              background: mode === 'genres' ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' : 'transparent',
              color: mode === 'genres' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: mode === 'genres' ? '0 2px 10px rgba(6, 182, 212, 0.4)' : 'none'
            }}
            onClick={() => setMode('genres')}
          >
            <TrendingUp size={15} /> Genre Traversal
          </button>
        </div>
      </div>

      {/* MODE 1: MEMBER-CENTRIC PERSONALIZED RECOMMENDATIONS */}
      {mode === 'member' && (
        <div>
          {/* Member Picker */}
          <div className="glass-panel" style={{ 
            padding: '1.45rem 1.75rem', 
            marginBottom: '2.25rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1.25rem',
            borderRadius: 'var(--radius-xl)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1 1 340px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap' }}>
                Select Member to Recommend For:
              </label>
              <select
                className="form-control"
                style={{ maxWidth: '360px', borderRadius: 'var(--radius-full)' }}
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                {members.map(m => (
                  <option key={m.member_id} value={m.member_id}>
                    {m.member_id}: {m.name} ({m.membership_type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {memberQuery && <QueryBadge query={memberQuery} />}
          </div>

          {/* Results Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
              <Sparkles size={36} className="spinning" style={{ opacity: 0.6, marginBottom: '1.25rem', color: '#06b6d4' }} />
              <p style={{ fontWeight: 600 }}>Traversing Neo4j Collaborative Filtering Subgraphs...</p>
            </div>
          ) : memberRecs.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4.5rem 1.5rem', borderRadius: 'var(--radius-xl)' }}>
              <Compass size={44} style={{ opacity: 0.35, marginBottom: '1.25rem', color: '#06b6d4' }} />
              <h4 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.45rem' }}>No Recommendations Generated Yet</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto' }}>
                This member has not borrowed enough books to establish peer overlap clusters. Check out titles to activate graph affinity!
              </p>
            </div>
          ) : (
            <div className="grid-responsive">
              {memberRecs.map(rec => (
                <div 
                  key={rec.book_id}
                  className="glass-panel"
                  onClick={() => navigateToBook(rec.book_id)}
                  style={{ 
                    padding: '1.65rem', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    borderRadius: 'var(--radius-lg)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.18)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                    e.currentTarget.style.boxShadow = '0 16px 36px -4px rgba(0,0,0,0.7), 0 0 25px rgba(6, 182, 212, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glass)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span className="badge badge-neo4j" style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
                        {rec.book_id}
                      </span>
                      <span style={{ 
                        fontSize: '0.78rem', 
                        fontWeight: 800, 
                        color: '#38bdf8',
                        background: 'rgba(6, 182, 212, 0.15)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(6, 182, 212, 0.3)'
                      }}>
                        Affinity: {rec.recommendation_score}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.35, marginBottom: '0.45rem', color: '#fff' }}>
                      {rec.title}
                    </h4>

                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                      {rec.authors?.join(', ')} ({rec.year})
                    </p>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                      {rec.genres?.map(g => (
                        <span key={g} className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>{g}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.85rem',
                    fontSize: '0.78rem',
                    color: '#93c5fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(6, 182, 212, 0.06)',
                    margin: '0 -1.65rem -1.65rem',
                    padding: '0.85rem 1.65rem',
                    borderBottomLeftRadius: 'var(--radius-lg)',
                    borderBottomRightRadius: 'var(--radius-lg)'
                  }}>
                    <Sparkles size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{rec.why}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: BOOK NEIGHBORHOOD RECOMMENDATIONS */}
      {mode === 'book' && (
        <div>
          {/* Book Picker */}
          <div className="glass-panel" style={{ 
            padding: '1.45rem 1.75rem', 
            marginBottom: '2.25rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1.25rem',
            borderRadius: 'var(--radius-xl)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1 1 340px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap' }}>
                Select Book to Analyze:
              </label>
              <select
                className="form-control"
                style={{ maxWidth: '440px', borderRadius: 'var(--radius-full)' }}
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
              >
                {books.map(b => (
                  <option key={b.book_id} value={b.book_id}>
                    {b.book_id}: {b.title}
                  </option>
                ))}
              </select>
            </div>

            {alsoQuery && <QueryBadge query={alsoQuery} />}
          </div>

          {/* Collaborative Filtering Section */}
          <div style={{ marginBottom: '3.25rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Collaborative Filtering ("Readers Also Borrowed")
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.45rem' }}>
              Ranked by total distinct members who borrowed both titles: <code>(:Book)&lt;-[:BORROWED]-(:Member)-[:BORROWED]-&gt;(:Book)</code>
            </p>

            <div className="grid-responsive">
              {alsoBorrowed.map(b => (
                <div 
                  key={b.book_id}
                  className="glass-panel"
                  onClick={() => navigateToBook(b.book_id)}
                  style={{ padding: '1.35rem', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <span className="badge badge-neo4j" style={{ fontSize: '0.72rem' }}>{b.book_id}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>{b.common_readers} common readers</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: '#fff' }}>{b.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.genres?.join(', ')} • {b.year}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Similar Genres Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Content-Based Multi-Genre Overlap
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Books sharing 2 or more genre nodes with the selected title
                </p>
              </div>
              {similarQuery && <QueryBadge query={similarQuery} />}
            </div>

            <div className="grid-responsive">
              {similarGenres.map(b => (
                <div 
                  key={b.book_id}
                  className="glass-panel"
                  onClick={() => navigateToBook(b.book_id)}
                  style={{ padding: '1.35rem', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <span className="badge badge-mongo" style={{ fontSize: '0.72rem' }}>{b.book_id}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>{b.shared_genres_count} shared genres</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: '#fff' }}>{b.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                    Matching: {b.shared_genres?.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: GENRE POPULARITY BY BORROW GRAPH */}
      {mode === 'genres' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Genre Circulation Traversal</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Computed via <code>MATCH (g:Genre)&lt;-[:IN_GENRE]-(b:Book)&lt;-[:BORROWED]-(m:Member)</code>
              </p>
            </div>

            {genreQuery && <QueryBadge query={genreQuery} />}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.45rem' }}>
            {genreRanking.map((g, idx) => (
              <div 
                key={g.genre} 
                className="glass-panel" 
                style={{ 
                  padding: '1.35rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: idx < 3 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: idx < 3 ? '#fbbf24' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    border: `1px solid ${idx < 3 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`
                  }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#fff' }}>{g.genre}</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>Genre Category</div>
                  </div>
                </div>

                <span className="badge badge-neo4j" style={{ fontWeight: 700 }}>
                  {g.borrow_count} borrows
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
