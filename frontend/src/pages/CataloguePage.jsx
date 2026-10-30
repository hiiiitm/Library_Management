import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  Check,
  RefreshCw,
  Terminal,
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';
import QueryBadge from '../components/QueryBadge';

export default function CataloguePage() {
  const { navigateToBook, openQueryInspector } = useApp();
  
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeQuery, setActiveQuery] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [author, setAuthor] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('avg_rating_desc');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Load filter options once
  useEffect(() => {
    api.getCatalogueMeta()
      .then(res => setMetadata(res))
      .catch(console.error);
  }, []);

  // Fetch books on filter change
  useEffect(() => {
    setLoading(true);
    api.getBooks({
      search,
      genre,
      author,
      available_only: availableOnly,
      sort_by: sortBy,
      skip: page * limit,
      limit
    })
    .then(res => {
      setBooks(res.books || []);
      setTotal(res.total || 0);
      setActiveQuery(res.query);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [search, genre, author, availableOnly, sortBy, page]);

  const handleReset = () => {
    setSearch('');
    setGenre('All');
    setAuthor('All');
    setAvailableOnly(false);
    setSortBy('avg_rating_desc');
    setPage(0);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-mongo" style={{ fontSize: '0.72rem' }}>Indexed Collection</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Stemmed Full-Text Search</span>
          </div>
          <h1 className="page-title">Library Catalogue</h1>
          <p className="page-subtitle">
            Explore 220+ curated titles across 18 genres with real-time MongoDB full-text search indexing & multi-attribute filters
          </p>
        </div>

        {activeQuery && (
          <QueryBadge query={activeQuery} />
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ 
        padding: '1.45rem 1.75rem', 
        marginBottom: '2.25rem',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search 
              size={18} 
              color="var(--accent-secondary)" 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search title, author, synopsis, tags..."
              style={{ paddingLeft: '2.65rem', borderRadius: 'var(--radius-full)' }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>

          {/* Genre Filter */}
          <div style={{ minWidth: '190px' }}>
            <select
              className="form-control"
              style={{ borderRadius: 'var(--radius-full)' }}
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                setPage(0);
              }}
            >
              <option value="All">All Genres ({metadata?.genres?.length || 0})</option>
              {metadata?.genres?.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div style={{ minWidth: '190px' }}>
            <select
              className="form-control"
              style={{ borderRadius: 'var(--radius-full)' }}
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                setPage(0);
              }}
            >
              <option value="All">All Authors ({metadata?.authors?.length || 0})</option>
              {metadata?.authors?.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div style={{ minWidth: '170px' }}>
            <select
              className="form-control"
              style={{ borderRadius: 'var(--radius-full)' }}
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(0);
              }}
            >
              <option value="avg_rating_desc">Highest Rated</option>
              <option value="popularity_desc">Most Popular</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="year_desc">Newest First</option>
              <option value="year_asc">Oldest First</option>
            </select>
          </div>

          {/* Availability Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            fontSize: '0.86rem',
            fontWeight: 600,
            userSelect: 'none',
            color: availableOnly ? '#34d399' : 'var(--text-muted)',
            padding: '0.45rem 0.95rem',
            background: availableOnly ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${availableOnly ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-subtle)'}`,
            transition: 'all 0.2s ease'
          }}>
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => {
                setAvailableOnly(e.target.checked);
                setPage(0);
              }}
              style={{ accentColor: '#10b981', cursor: 'pointer' }}
            />
            Available In Stock Only
          </label>

          {/* Reset Filters Button */}
          {(search || genre !== 'All' || author !== 'All' || availableOnly) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleReset}
              title="Reset all filters"
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <RefreshCw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Results Count & Top Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.45rem' }}>
        <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: '#ffffff' }}>{books.length}</strong> of <strong style={{ color: '#ffffff' }}>{total}</strong> catalogued titles
          {search && <span> matching "<em style={{ color: '#38bdf8' }}>{search}</em>"</span>}
          {genre !== 'All' && <span> under <strong style={{ color: '#fbbf24' }}>{genre}</strong></span>}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              style={{ opacity: page === 0 ? 0.35 : 1, borderRadius: 'var(--radius-sm)' }}
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              style={{ opacity: page >= totalPages - 1 ? 0.35 : 1, borderRadius: 'var(--radius-sm)' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Book Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="spinning" style={{ opacity: 0.6, marginBottom: '1.25rem', color: '#6366f1' }} />
          <p style={{ fontWeight: 600 }}>Executing MongoDB Full-Text & Projection Pipeline...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4.5rem 1.5rem', borderRadius: 'var(--radius-xl)' }}>
          <Search size={44} style={{ opacity: 0.3, marginBottom: '1.25rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#fff' }}>No Titles Match Criteria</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Try broadening your search term or clearing active genre and availability filters.
          </p>
          <button className="btn btn-primary btn-sm" onClick={handleReset}>
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid-responsive">
          {books.map(b => (
            <BookCard key={b.book_id} book={b} onSelect={() => navigateToBook(b.book_id)} />
          ))}
        </div>
      )}

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginTop: '3rem' }}>
          <button
            className="btn btn-secondary"
            disabled={page === 0}
            onClick={() => {
              setPage(p => Math.max(0, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ opacity: page === 0 ? 0.35 : 1 }}
          >
            <ChevronLeft size={15} /> Previous
          </button>

          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Page {page + 1} of {totalPages}
          </span>

          <button
            className="btn btn-secondary"
            disabled={page >= totalPages - 1}
            onClick={() => {
              setPage(p => p + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ opacity: page >= totalPages - 1 ? 0.35 : 1 }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
