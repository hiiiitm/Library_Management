import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Star, 
  BookOpen, 
  User, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  MessageSquarePlus, 
  Repeat, 
  Bookmark,
  Share2,
  Layers,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';
import QueryBadge from '../components/QueryBadge';

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

export default function BookDetailPage() {
  const { selectedBookId, setActiveTab, navigateToBook, role, activeMemberId, addToast } = useApp();

  const [bookData, setBookData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [alsoBorrowed, setAlsoBorrowed] = useState([]);
  const [moreByAuthor, setMoreByAuthor] = useState([]);
  const [similarGenres, setSimilarGenres] = useState([]);
  
  const [bookQuery, setBookQuery] = useState(null);
  const [alsoQuery, setAlsoQuery] = useState(null);
  const [moreQuery, setMoreQuery] = useState(null);
  const [similarQuery, setSimilarQuery] = useState(null);

  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  const bookId = selectedBookId || 'B0001';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getBookDetail(bookId),
      api.getAlsoBorrowed(bookId, 4),
      api.getMoreByAuthor(bookId, 4),
      api.getSimilarGenres(bookId, 4)
    ])
    .then(([bRes, alsoRes, moreRes, simRes]) => {
      setBookData(bRes.book);
      setReviews(bRes.reviews || []);
      setBookQuery(bRes.query);

      setAlsoBorrowed(alsoRes.recommendations || []);
      setAlsoQuery(alsoRes.query);

      setMoreByAuthor(moreRes.author_books || []);
      setMoreQuery(moreRes.query);

      setSimilarGenres(simRes.similar_books || []);
      setSimilarQuery(simRes.query);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [bookId]);

  const handleCheckout = () => {
    if (!bookData) return;
    api.checkoutBook(bookData.book_id, activeMemberId)
      .then(res => {
        addToast(res.message, 'success');
        api.getBookDetail(bookId).then(r => setBookData(r.book));
      })
      .catch(err => {
        addToast(err.message, 'error');
      });
  };

  const handleReserve = () => {
    if (!bookData) return;
    api.createReservation(bookData.book_id, activeMemberId)
      .then(res => {
        addToast(res.message, 'success');
      })
      .catch(err => {
        addToast(err.message, 'error');
      });
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    api.addReview({
      book_id: bookId,
      member_id: activeMemberId,
      rating: newRating,
      comment: newComment
    })
    .then(res => {
      addToast('Review submitted successfully!', 'success');
      setReviews(prev => [res.review, ...prev]);
      setReviewModalOpen(false);
      setNewComment('');
      setBookData(prev => ({
        ...prev,
        avg_rating: res.new_avg_rating,
        ratings_count: (prev.ratings_count || 0) + 1
      }));
    })
    .catch(err => addToast(err.message, 'error'));
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '7rem 1rem' }}>
        <Sparkles size={40} className="spinning" style={{ opacity: 0.6, marginBottom: '1.25rem', color: '#06b6d4' }} />
        <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>Traversing MongoDB Documents & Neo4j Subgraphs...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
          Fetching metadata and running parallel collaborative filtering algorithms.
        </p>
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="page-wrapper">
        <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('catalogue')}>
          <ArrowLeft size={14} /> Back to Catalogue
        </button>
        <p style={{ marginTop: '2.5rem', color: 'var(--text-muted)' }}>Book record not found.</p>
      </div>
    );
  }

  const isAvailable = (bookData.available_copies || 0) > 0;
  const primaryGenre = bookData.genres?.[0] || 'Fiction';
  const coverGradient = GENRE_GRADIENTS[primaryGenre] || 'linear-gradient(135deg, #1e1b4b 0%, #06b6d4 100%)';

  // Extract initials
  const initials = bookData.title
    .split(' ')
    .filter(w => !['the', 'a', 'an', 'of', 'and', 'in'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || bookData.title.slice(0, 2).toUpperCase();

  return (
    <div className="page-wrapper">
      {/* Back button & Query badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={() => setActiveTab('catalogue')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <ArrowLeft size={14} /> <span>Back to Catalogue</span>
        </button>

        {bookQuery && <QueryBadge query={bookQuery} />}
      </div>

      {/* Book Primary Card Hero */}
      <div className="glass-panel" style={{ 
        padding: '2.25rem', 
        marginBottom: '2.75rem',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'start' }}>
          {/* Left: 3D Hardcover Book Showcase & Quick Meta */}
          <div>
            <div style={{
              height: '380px',
              borderRadius: 'var(--radius-lg)',
              background: coverGradient,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '2.25rem',
              boxShadow: '0 25px 50px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              {/* Realistic Book Spine Seam & Depth Shadow */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '28px',
                background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(255,255,255,0.15) 15%, transparent 100%)',
                borderRight: '1px solid rgba(0,0,0,0.35)',
                pointerEvents: 'none'
              }} />

              {/* Monogram Watermark */}
              <div style={{
                position: 'absolute',
                right: '1.5rem',
                bottom: '1rem',
                fontSize: '6.5rem',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.14)',
                userSelect: 'none',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                pointerEvents: 'none',
                textShadow: '0 2px 12px rgba(0,0,0,0.6)'
              }}>
                {initials}
              </div>

              <div style={{ position: 'relative', zIndex: 2, paddingLeft: '0.75rem' }}>
                <span style={{
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'rgba(0, 0, 0, 0.45)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)'
                }}>
                  {bookData.book_id}
                </span>
              </div>

              <div style={{ position: 'relative', zIndex: 2, paddingLeft: '0.75rem' }}>
                <span style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '0.22rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'inline-block',
                  marginBottom: '0.65rem'
                }}>
                  {primaryGenre}
                </span>
                <h2 style={{ fontSize: '1.75rem', lineHeight: 1.25, color: '#fff', marginBottom: '0.5rem', fontWeight: 800 }}>
                  {bookData.title}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.98rem', fontWeight: 600 }}>
                  {bookData.authors?.map(a => a.name).join(', ')}
                </p>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                position: 'relative', 
                zIndex: 2, 
                paddingLeft: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                paddingTop: '0.85rem'
              }}>
                <span style={{ fontSize: '0.84rem', color: '#e2e8f0' }}>{bookData.publisher}</span>
                <span style={{ fontSize: '0.84rem', color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                  {bookData.publication_year}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {isAvailable ? (
                <button 
                  className="btn btn-primary"
                  onClick={handleCheckout}
                  style={{ width: '100%', padding: '0.95rem', fontSize: '0.95rem' }}
                >
                  <Repeat size={18} /> Instant Loan Checkout ({bookData.available_copies} In Stock)
                </button>
              ) : (
                <button 
                  className="btn btn-secondary"
                  onClick={handleReserve}
                  style={{ width: '100%', padding: '0.95rem', borderColor: 'rgba(245, 158, 11, 0.5)' }}
                >
                  <Bookmark size={18} color="#fbbf24" /> Place Hold & Reserve Title
                </button>
              )}

              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setReviewModalOpen(true)}
                style={{ width: '100%', padding: '0.65rem' }}
              >
                <MessageSquarePlus size={15} /> Write Reader Review
              </button>
            </div>
          </div>

          {/* Right: Full Document Details */}
          <div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {bookData.genres?.map(g => (
                <span key={g} className="badge badge-mongo">{g}</span>
              ))}
              <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`}>
                {isAvailable ? `${bookData.available_copies} of ${bookData.total_copies} Copies Available` : 'All Copies Checked Out'}
              </span>
            </div>

            <h1 style={{ fontSize: '2.15rem', marginBottom: '0.65rem', lineHeight: 1.25 }}>
              {bookData.title}
            </h1>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.75rem', 
              marginBottom: '1.75rem', 
              fontSize: '0.9rem', 
              color: 'var(--text-muted)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24' }}>
                <Star size={18} fill="#fbbf24" stroke="#fbbf24" />
                <strong style={{ fontSize: '1.1rem', color: '#fff' }}>
                  {bookData.avg_rating > 0 ? bookData.avg_rating.toFixed(2) : 'Not Rated'}
                </strong>
                <span style={{ color: 'var(--text-dim)' }}>({bookData.ratings_count || 0} reviews)</span>
              </div>
              <div>Shelf: <strong style={{ color: '#fff' }}>{bookData.shelf_location || 'GEN-01'}</strong></div>
              <div>Pages: <strong style={{ color: '#fff' }}>{bookData.pages}</strong></div>
              <div>Language: <strong style={{ color: '#fff' }}>{bookData.language}</strong></div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ 
                fontSize: '0.78rem', 
                color: 'var(--text-dim)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                marginBottom: '0.5rem' 
              }}>
                Synopsis & Description
              </h4>
              <p style={{ fontSize: '0.96rem', lineHeight: 1.7, color: '#e2e8f0' }}>
                {bookData.description}
              </p>
            </div>

            {/* Tags */}
            {bookData.tags && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ 
                  fontSize: '0.78rem', 
                  color: 'var(--text-dim)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em',
                  marginBottom: '0.5rem' 
                }}>
                  Subject Tags
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {bookData.tags.map(t => (
                    <span key={t} className="badge badge-neutral" style={{ padding: '0.3rem 0.7rem' }}>
                      <Tag size={11} color="var(--accent-secondary)" /> {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Document Attributes Table */}
            <div style={{
              background: 'rgba(12, 17, 30, 0.6)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              border: '1px solid var(--border-medium)',
              fontSize: '0.85rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div><span style={{ color: 'var(--text-dim)' }}>ISBN-13:</span> <strong style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{bookData.isbn13}</strong></div>
              <div><span style={{ color: 'var(--text-dim)' }}>Publisher:</span> <strong style={{ color: '#fff' }}>{bookData.publisher}</strong></div>
              <div><span style={{ color: 'var(--text-dim)' }}>Total Inventory:</span> <strong style={{ color: '#fff' }}>{bookData.total_copies} physical copies</strong></div>
              <div><span style={{ color: 'var(--text-dim)' }}>Catalog Date:</span> <strong style={{ color: '#fff' }}>{bookData.created_at?.slice(0, 10)}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Neo4j Real-Time Intelligence Section */}
      <div style={{ marginBottom: '3.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.45rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-neo4j">Neo4j Relationship Brain</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Readers Who Borrowed This Also Borrowed</h2>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Collaborative filtering pattern traversed through real-time <code>(Member)-[:BORROWED]-&gt;(Book)</code> graph relationships
            </p>
          </div>

          {alsoQuery && <QueryBadge query={alsoQuery} />}
        </div>

        {alsoBorrowed.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No co-borrowed titles found yet for this title.
          </div>
        ) : (
          <div className="grid-responsive">
            {alsoBorrowed.map(b => (
              <div 
                key={b.book_id}
                className="glass-panel"
                onClick={() => navigateToBook(b.book_id)}
                style={{ 
                  padding: '1.35rem', 
                  cursor: 'pointer',
                  borderTop: '1px solid rgba(255, 255, 255, 0.16)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700 }}>
                    {b.book_id}
                  </span>
                  <span className="badge badge-neo4j" style={{ fontSize: '0.72rem' }}>
                    {b.common_readers} common readers
                  </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: '#fff' }}>
                  {b.title}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {b.genres?.join(', ')} • {b.year}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* More by this Author (Neo4j) */}
      {moreByAuthor.length > 0 && (
        <div style={{ marginBottom: '3.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.45rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>More by this Author</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Traversed from <code>(Author)-[:WROTE]-&gt;(Book)</code></p>
            </div>
            {moreQuery && <QueryBadge query={moreQuery} />}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
            {moreByAuthor.map(b => (
              <div 
                key={b.book_id}
                className="glass-panel"
                onClick={() => navigateToBook(b.book_id)}
                style={{ padding: '1.25rem', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#93c5fd', marginBottom: '0.35rem' }}>
                  {b.book_id}
                </div>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '0.35rem', color: '#fff' }}>
                  {b.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {b.author_name} ({b.year})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reader Reviews (MongoDB) */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Verified Reader Reviews ({reviews.length})</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Feedback from members who have borrowed this title</p>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => setReviewModalOpen(true)}>
            <MessageSquarePlus size={15} /> Write Reader Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
            No reviews yet for this title. Be the first to share your thoughts!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {reviews.map(r => (
              <div key={r.review_id || Math.random()} style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(12, 17, 30, 0.6)',
                border: '1px solid var(--border-medium)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#fff'
                    }}>
                      {r.member_name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: '#fff' }}>{r.member_name}</strong>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginLeft: '0.45rem', fontFamily: 'var(--font-mono)' }}>
                        ({r.member_id})
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < r.rating ? '#fbbf24' : 'none'} 
                        color={i < r.rating ? '#fbbf24' : '#475569'} 
                      />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5, marginTop: '0.35rem' }}>
                  {r.comment}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                  {r.created_at?.slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {reviewModalOpen && (
        <div className="modal-overlay" onClick={() => setReviewModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.45rem 1.75rem', borderBottom: '1px solid var(--border-medium)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Review '{bookData.title}'</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Share your reading experience with the library community</p>
            </div>
            <form onSubmit={handleAddReview} style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1.45rem' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Rating (1 to 5 Stars)
                </label>
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      style={{
                        background: star <= newRating ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${star <= newRating ? 'rgba(251, 191, 36, 0.45)' : 'var(--border-subtle)'}`,
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Star size={22} fill={star <= newRating ? '#fbbf24' : 'none'} color="#fbbf24" />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Your Review
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Share your thoughts on this book's depth, style, and insights..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReviewModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
