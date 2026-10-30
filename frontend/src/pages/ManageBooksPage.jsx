import React, { useEffect, useState } from 'react';
import { 
  BookPlus, 
  Edit3, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Layers,
  Database,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import QueryBadge from '../components/QueryBadge';

export default function ManageBooksPage() {
  const { addToast } = useApp();

  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeQuery, setActiveQuery] = useState(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [genre, setGenre] = useState('Fiction');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState(2024);
  const [pages, setPages] = useState(300);
  const [copies, setCopies] = useState(5);
  const [description, setDescription] = useState('');
  const [isbn13, setIsbn13] = useState('');

  const loadBooks = () => {
    setLoading(true);
    api.getBooks({ search, limit: 50 })
      .then(res => {
        setBooks(res.books || []);
        setTotal(res.total || 0);
        setActiveQuery(res.query);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooks();
  }, [search]);

  const resetForm = () => {
    setTitle('');
    setAuthorName('');
    setGenre('Fiction');
    setPublisher('');
    setYear(2024);
    setPages(300);
    setCopies(5);
    setDescription('');
    setIsbn13('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBook(b);
    setTitle(b.title);
    setAuthorName(b.authors?.[0]?.name || '');
    setGenre(b.genres?.[0] || 'Fiction');
    setPublisher(b.publisher);
    setYear(b.publication_year);
    setPages(b.pages);
    setCopies(b.total_copies);
    setDescription(b.description);
    setIsbn13(b.isbn13);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingBook) {
      // Update
      api.updateBook(editingBook.book_id, {
        title,
        genres: [genre],
        publisher,
        publication_year: parseInt(year),
        pages: parseInt(pages),
        total_copies: parseInt(copies),
        description
      })
      .then(res => {
        addToast(`Book ${editingBook.book_id} updated and synced across MongoDB and Neo4j!`, 'success');
        setEditingBook(null);
        loadBooks();
      })
      .catch(err => addToast(err.message, 'error'));
    } else {
      // Create
      api.createBook({
        title,
        isbn13: isbn13 || `978000${Math.floor(1000000 + Math.random() * 9000000)}`,
        authors: [{ author_id: 'A_NEW', name: authorName }],
        genres: [genre],
        publisher: publisher || 'Independent Press',
        publication_year: parseInt(year),
        pages: parseInt(pages),
        total_copies: parseInt(copies),
        description,
        tags: [genre.toLowerCase(), 'library-pick']
      })
      .then(res => {
        addToast(`Book created! Primary record saved in MongoDB, graph nodes projected in Neo4j.`, 'success');
        setIsAddModalOpen(false);
        resetForm();
        loadBooks();
      })
      .catch(err => addToast(err.message, 'error'));
    }
  };

  const handleDelete = (bookId, title) => {
    if (window.confirm(`Are you sure you want to delete '${title}'? This will remove the document from MongoDB and detach all relationships in Neo4j.`)) {
      api.deleteBook(bookId)
        .then(res => {
          addToast(res.message, 'success');
          loadBooks();
        })
        .catch(err => addToast(err.message, 'error'));
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-mongo" style={{ fontSize: '0.72rem' }}>Dual-Write Sync Engine</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sync Outbox Orchestration</span>
          </div>
          <h1 className="page-title">Catalog Inventory Management</h1>
          <p className="page-subtitle">
            Chief Librarian CRUD workbench with automatic dual-database projection across MongoDB Documents and Neo4j Graph Nodes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          {activeQuery && <QueryBadge query={activeQuery} />}
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            <BookPlus size={15} /> <span>Add New Title</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel" style={{ 
        padding: '1.25rem 1.75rem', 
        marginBottom: '1.75rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ flex: '1 1 320px', maxWidth: '440px', position: 'relative' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search books to edit, update copies, or purge..."
            style={{ paddingLeft: '2.6rem', borderRadius: 'var(--radius-full)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Total Catalogued Titles: <strong style={{ color: '#fff' }}>{total}</strong>
        </span>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Book ID</th>
              <th>Book Title</th>
              <th>Primary Author</th>
              <th>Primary Genre</th>
              <th>Publisher</th>
              <th>Year</th>
              <th>Physical Copies</th>
              <th>Rating</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map(b => (
              <tr key={b.book_id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#93c5fd', fontWeight: 600 }}>
                  {b.book_id}
                </td>
                <td style={{ fontWeight: 600, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.title}
                </td>
                <td style={{ color: 'var(--text-muted)' }}>
                  {b.authors?.[0]?.name || 'N/A'}
                </td>
                <td>
                  <span className="badge badge-mongo">
                    {b.genres?.[0] || 'Fiction'}
                  </span>
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  {b.publisher}
                </td>
                <td style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                  {b.publication_year}
                </td>
                <td>
                  <span className={`badge ${b.available_copies > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                    {b.available_copies} / {b.total_copies}
                  </span>
                </td>
                <td style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24' }}>
                  ★ {b.avg_rating > 0 ? b.avg_rating.toFixed(1) : 'New'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(b)}
                      title="Edit book metadata"
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(b.book_id, b.title)}
                      title="Delete from MongoDB and Neo4j"
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingBook) && (
        <div className="modal-overlay" onClick={() => { setIsAddModalOpen(false); setEditingBook(null); }}>
          <div className="modal-card" style={{ maxWidth: '680px', borderRadius: 'var(--radius-xl)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              padding: '1.45rem 1.75rem', 
              borderBottom: '1px solid var(--border-medium)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'rgba(12, 17, 30, 0.75)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  {editingBook ? `Edit Book (${editingBook.book_id})` : 'Add New Title to Catalog'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Writes to MongoDB primary document store, then projects Neo4j graph nodes
                </p>
              </div>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingBook(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Book Title
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {!editingBook && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                      Primary Author Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Martin Fowler"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Primary Genre
                  </label>
                  <select
                    className="form-control"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  >
                    {[
                      'Computer Science & Technology', 'Indian Authors', 'Classics', 'Sci-Fi', 
                      'Fantasy', 'Mystery', 'Thriller', 'Philosophy', 'Science', 'History', 
                      'Biography', 'Self-Help', 'Business', 'Romance', 'Fiction', 'Poetry', 
                      'Children', 'Graphic Novels'
                    ].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Publisher
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Publication Year
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Page Count
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Total Inventory Copies
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    max={50}
                    value={copies}
                    onChange={(e) => setCopies(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Description / Synopsis
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setIsAddModalOpen(false); setEditingBook(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBook ? 'Save & Sync Updates' : 'Create & Project into Neo4j'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
