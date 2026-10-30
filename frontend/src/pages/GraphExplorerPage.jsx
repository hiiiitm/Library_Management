import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { 
  Share2, 
  Route, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Info,
  ArrowRight,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import QueryBadge from '../components/QueryBadge';

export default function GraphExplorerPage() {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const { navigateToBook } = useApp();

  const [viewType, setViewType] = useState('authors'); // 'authors' | 'genres' | 'books'
  const [graphData, setGraphData] = useState(null);
  const [graphQuery, setGraphQuery] = useState(null);
  const [loading, setLoading] = useState(true);

  // Shortest Path state
  const [authorsList, setAuthorsList] = useState([]);
  const [author1, setAuthor1] = useState('');
  const [author2, setAuthor2] = useState('');
  const [pathResult, setPathResult] = useState(null);
  const [pathQuery, setPathQuery] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);

  // Load connected authors list for shortest path dropdowns
  useEffect(() => {
    api.getConnectedAuthors(40)
      .then(res => {
        setAuthorsList(res.authors || []);
        if (res.authors?.length >= 2) {
          setAuthor1(res.authors[0].author_id);
          setAuthor2(res.authors[1].author_id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch graph network data
  useEffect(() => {
    setLoading(true);
    api.getGraphNetwork(viewType, 70)
      .then(res => {
        setGraphData(res);
        setGraphQuery(res.query);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [viewType]);

  // Initialize Vis Network
  useEffect(() => {
    if (!containerRef.current || !graphData || loading) return;

    // Define color mappings with luminous neon accents
    const groupColors = {
      author: { 
        background: '#f59e0b', 
        border: '#d97706', 
        highlight: { background: '#fbbf24', border: '#f59e0b' } 
      },
      book: { 
        background: '#0284c7', 
        border: '#0369a1', 
        highlight: { background: '#38bdf8', border: '#0284c7' } 
      },
      genre: { 
        background: '#10b981', 
        border: '#059669', 
        highlight: { background: '#34d399', border: '#10b981' } 
      },
      member: { 
        background: '#a855f7', 
        border: '#7e22ce', 
        highlight: { background: '#c084fc', border: '#a855f7' } 
      }
    };

    const data = {
      nodes: graphData.nodes.map(n => ({
        ...n,
        color: groupColors[n.group] || groupColors.book,
        font: { color: '#ffffff', size: 12, face: 'Plus Jakarta Sans', strokeWidth: 2, strokeColor: '#05070c' },
        shape: n.group === 'author' ? 'dot' : n.group === 'genre' ? 'diamond' : 'box',
        size: n.group === 'author' ? 16 : n.group === 'genre' ? 22 : 12,
        margin: 8
      })),
      edges: graphData.edges.map(e => ({
        ...e,
        color: { color: 'rgba(255, 255, 255, 0.22)', highlight: '#38bdf8' },
        width: 1.5,
        smooth: { type: 'continuous' }
      }))
    };

    const options = {
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -40,
          centralGravity: 0.008,
          springLength: 95,
          springConstant: 0.16
        },
        stabilization: { iterations: 120 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true
      }
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    // Node click handler
    network.on('click', (params) => {
      if (params.nodes?.length > 0) {
        const clickedId = params.nodes[0];
        if (clickedId.startsWith('B')) {
          navigateToBook(clickedId);
        }
      }
    });

    return () => {
      network.destroy();
    };
  }, [graphData, loading]);

  const handleRunShortestPath = (e) => {
    e.preventDefault();
    if (!author1 || !author2 || author1 === author2) return;

    setPathLoading(true);
    api.getShortestPath(author1, author2)
      .then(res => {
        setPathResult(res);
        setPathQuery(res.query);
      })
      .catch(console.error)
      .finally(() => setPathLoading(false));
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-neo4j" style={{ fontSize: '0.72rem' }}>Neo4j Engine</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Physics-Based Network Graph</span>
          </div>
          <h1 className="page-title">Interactive Graph Explorer</h1>
          <p className="page-subtitle">
            Visual topology and Dijkstra shortest-path traversal across Neo4j graph nodes and index-free adjacency relationships
          </p>
        </div>

        {graphQuery && <QueryBadge query={graphQuery} />}
      </div>

      {/* Control bar */}
      <div className="glass-panel" style={{ 
        padding: '1.15rem 1.75rem', 
        marginBottom: '1.75rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1.25rem',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
            Graph Projection:
          </span>
          <button
            className={`btn btn-sm ${viewType === 'authors' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setViewType('authors')}
          >
            Author-Book Network
          </button>
          <button
            className={`btn btn-sm ${viewType === 'genres' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setViewType('genres')}
          >
            Book-Genre Clusters
          </button>
          <button
            className={`btn btn-sm ${viewType === 'books' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
            onClick={() => setViewType('books')}
          >
            Member Borrow Network
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }}></span> Author
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0284c7', boxShadow: '0 0 8px #0284c7' }}></span> Book
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '10px', height: '10px', transform: 'rotate(45deg)', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span> Genre
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px #a855f7' }}></span> Member
          </span>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="glass-panel" style={{
        position: 'relative',
        height: '560px',
        overflow: 'hidden',
        marginBottom: '2.75rem',
        background: '#04070e',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), inset 0 0 40px rgba(6, 182, 212, 0.05)'
      }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(4, 7, 14, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            zIndex: 10
          }}>
            <RefreshCw size={28} className="spinning" style={{ marginRight: '0.85rem', color: '#06b6d4' }} />
            <span style={{ fontWeight: 600 }}>Rendering Graph Physics Simulation...</span>
          </div>
        )}

        <div style={{
          position: 'absolute',
          bottom: '1.25rem',
          left: '1.25rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          background: 'rgba(8, 12, 22, 0.85)',
          padding: '0.5rem 0.95rem',
          borderRadius: 'var(--radius-md)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
        }}>
          💡 <strong>Interaction:</strong> Drag nodes to reorganize, scroll mouse wheel to zoom, click any Book node to view full details
        </div>
      </div>

      {/* Shortest Path Between Authors Tool */}
      <div className="glass-panel" style={{ padding: '2.25rem', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-neo4j">Neo4j ShortestPath Algorithm</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Degrees of Separation Between Authors</h3>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Computes shortest collaboration traversal chain: <code>MATCH p = shortestPath((a1)-[*]-(a2))</code>
            </p>
          </div>

          {pathQuery && <QueryBadge query={pathQuery} />}
        </div>

        <form onSubmit={handleRunShortestPath} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
              Origin Author
            </label>
            <select
              className="form-control"
              style={{ borderRadius: 'var(--radius-full)' }}
              value={author1}
              onChange={(e) => setAuthor1(e.target.value)}
            >
              {authorsList.map(a => (
                <option key={a.author_id} value={a.author_id}>
                  {a.name} ({a.books_count} books)
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
              Target Author
            </label>
            <select
              className="form-control"
              style={{ borderRadius: 'var(--radius-full)' }}
              value={author2}
              onChange={(e) => setAuthor2(e.target.value)}
            >
              {authorsList.map(a => (
                <option key={a.author_id} value={a.author_id}>
                  {a.name} ({a.books_count} books)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.72rem 1.45rem' }}
            disabled={pathLoading || !author1 || !author2 || author1 === author2}
          >
            {pathLoading ? 'Traversing Graph...' : 'Find Shortest Path'}
          </button>
        </form>

        {/* Shortest Path Results Visualizer */}
        {pathResult && (
          <div style={{
            background: 'rgba(12, 17, 30, 0.65)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            border: '1px solid var(--border-medium)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
          }}>
            {pathResult.found ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.96rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                    Path Discovered: {pathResult.hops} Relationship Hops ({pathResult.path_nodes.length} Connected Entities)
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {pathQuery?.execution_ms} ms execution
                  </span>
                </div>

                {/* Path Nodes Visual Sequence */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {pathResult.path_nodes.map((node, i) => {
                    const isAuthor = node.type === 'Author';
                    return (
                      <React.Fragment key={i}>
                        <div style={{
                          padding: '0.65rem 1.15rem',
                          borderRadius: 'var(--radius-md)',
                          background: isAuthor ? 'rgba(245, 158, 11, 0.16)' : 'rgba(2, 132, 199, 0.16)',
                          border: `1px solid ${isAuthor ? 'rgba(245, 158, 11, 0.45)' : 'rgba(2, 132, 199, 0.45)'}`,
                          color: '#fff',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          boxShadow: `0 4px 14px ${isAuthor ? 'rgba(245, 158, 11, 0.15)' : 'rgba(2, 132, 199, 0.15)'}`
                        }}>
                          <div style={{ fontSize: '0.66rem', color: isAuthor ? '#fbbf24' : '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {node.type}
                          </div>
                          {node.name}
                        </div>

                        {i < pathResult.path_nodes.length - 1 && (
                          <ArrowRight size={18} color="var(--text-dim)" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No direct collaboration path found between these two authors within the current subgraph traversal limit.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
