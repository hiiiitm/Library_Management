import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  TrendingUp, 
  PieChart, 
  FileCode, 
  Terminal,
  Calendar,
  BookOpen,
  Sparkles,
  Database
} from 'lucide-react';
import { api } from '../api/client';
import QueryBadge from '../components/QueryBadge';

export default function AnalyticsPage() {
  const [pipeline1, setPipeline1] = useState(null);
  const [pipeline2, setPipeline2] = useState(null);
  const [pipeline3, setPipeline3] = useState(null);
  const [pipeline4, setPipeline4] = useState(null);
  const [pipeline5, setPipeline5] = useState(null);
  const [pipeline6, setPipeline6] = useState(null);
  const [loading, setLoading] = useState(true);

  // Expanded pipeline code states
  const [expandedPipeline, setExpandedPipeline] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getPipelineGenres(),
      api.getPipelineTrends(),
      api.getPipelineBuckets(),
      api.getPipelinePublishers(),
      api.getPipelineFines(),
      api.getPipelineFacet()
    ])
    .then(([p1, p2, p3, p4, p5, p6]) => {
      setPipeline1(p1);
      setPipeline2(p2);
      setPipeline3(p3);
      setPipeline4(p4);
      setPipeline5(p5);
      setPipeline6(p6);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => {
    setExpandedPipeline(prev => prev === id ? null : id);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-mongo" style={{ fontSize: '0.72rem' }}>Native MongoDB Framework</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Multi-Stage Aggregations</span>
          </div>
          <h1 className="page-title">MongoDB Aggregation Analytics</h1>
          <p className="page-subtitle">
            Advanced analytical workloads executed directly within the MongoDB engine across multi-stage transformation pipelines
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="badge badge-mongo" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
            6 Multi-Stage Pipelines Loaded
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-muted)' }}>
          <Layers size={36} className="spinning" style={{ opacity: 0.6, marginBottom: '1.25rem', color: '#10b981' }} />
          <p style={{ fontWeight: 600 }}>Executing Multi-Stage Aggregation Pipelines on MongoDB...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* PIPELINE 1: GENRE DISTRIBUTION ($unwind, $group, $sort) */}
          <div className="glass-panel" style={{ padding: '2.25rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                  {pipeline1?.operators?.map(op => (
                    <span key={op} className="badge badge-mongo" style={{ fontFamily: 'var(--font-mono)' }}>{op}</span>
                  ))}
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Pipeline 1: Genre Holdings & Reader Scores</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Deconstructs embedded genre arrays with <code>$unwind</code>, then groups to calculate catalog density and reader average rating.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleExpand('p1')}
                >
                  <FileCode size={14} /> {expandedPipeline === 'p1' ? 'Hide Pipeline' : 'View Pipeline JSON'}
                </button>
                {pipeline1?.query && <QueryBadge query={pipeline1.query} />}
              </div>
            </div>

            {/* Expanded Code */}
            {expandedPipeline === 'p1' && (
              <pre className="code-block" style={{ marginBottom: '1.5rem' }}>
                <code>{pipeline1.query?.query_text}</code>
              </pre>
            )}

            {/* Visual Bar Chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {pipeline1?.data?.map(item => {
                const maxTitles = Math.max(...pipeline1.data.map(d => d.titles));
                const pct = (item.titles / maxTitles) * 100;

                return (
                  <div key={item.genre} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: '220px', fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                      {item.genre}
                    </div>

                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '20px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
                        borderRadius: 'var(--radius-full)',
                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
                      }} />
                    </div>

                    <div style={{ width: '150px', textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <strong style={{ color: '#fff' }}>{item.titles}</strong> titles • <span style={{ color: '#fbbf24', fontWeight: 700 }}>★ {item.avg_rating}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PIPELINE 2: MONTHLY LOAN TRENDS ($substr, $group, $sort) */}
          <div className="glass-panel" style={{ padding: '2.25rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.45rem' }}>
                  {pipeline2?.operators?.map(op => (
                    <span key={op} className="badge badge-mongo" style={{ fontFamily: 'var(--font-mono)' }}>{op}</span>
                  ))}
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Pipeline 2: Chronological Circulation Velocity</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Aggregates loan volume across the past 12 months using date substring projection and chronological grouping.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleExpand('p2')}
                >
                  <FileCode size={14} /> {expandedPipeline === 'p2' ? 'Hide Pipeline' : 'View Pipeline JSON'}
                </button>
                {pipeline2?.query && <QueryBadge query={pipeline2.query} />}
              </div>
            </div>

            {expandedPipeline === 'p2' && (
              <pre className="code-block" style={{ marginBottom: '1.5rem' }}>
                <code>{pipeline2.query?.query_text}</code>
              </pre>
            )}

            {/* Visual Column Trend */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.85rem', height: '180px', padding: '1.25rem 0 0' }}>
              {pipeline2?.data?.map(item => {
                const maxLoans = Math.max(...pipeline2.data.map(d => d.loans));
                const heightPct = Math.max(16, (item.loans / maxLoans) * 100);

                return (
                  <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.45rem' }}>
                      {item.loans}
                    </div>
                    <div style={{
                      width: '100%',
                      maxWidth: '42px',
                      height: `${heightPct}%`,
                      background: 'linear-gradient(180deg, #6366f1 0%, #1e1b4b 100%)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                    }} />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.6rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {item.month?.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PIPELINE 3: PAGE LENGTH BUCKETING ($bucket) */}
          <div className="glass-panel" style={{ padding: '2.25rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.45rem' }}>
                  {pipeline3?.operators?.map(op => (
                    <span key={op} className="badge badge-mongo" style={{ fontFamily: 'var(--font-mono)' }}>{op}</span>
                  ))}
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Pipeline 3: Reading Commitment Bucketing ($bucket)</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Segments titles into page count tiers (`&lt; 200`, `200-399`, `400-599`, `600+`) using the native <code>$bucket</code> operator.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleExpand('p3')}
                >
                  <FileCode size={14} /> {expandedPipeline === 'p3' ? 'Hide Pipeline' : 'View Pipeline JSON'}
                </button>
                {pipeline3?.query && <QueryBadge query={pipeline3.query} />}
              </div>
            </div>

            {expandedPipeline === 'p3' && (
              <pre className="code-block" style={{ marginBottom: '1.5rem' }}>
                <code>{pipeline3.query?.query_text}</code>
              </pre>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
              {pipeline3?.data?.map(b => (
                <div key={b.category} style={{
                  background: 'rgba(15, 22, 38, 0.7)',
                  padding: '1.45rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
                }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>{b.category}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>{b.books_count}</div>
                  <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.35rem', fontWeight: 600 }}>
                    Avg Rating: ★ {b.avg_rating}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PIPELINE 4: PUBLISHER MARKET SHARE ($group, $sort) */}
          <div className="glass-panel" style={{ padding: '2.25rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.45rem' }}>
                  {pipeline4?.operators?.map(op => (
                    <span key={op} className="badge badge-mongo" style={{ fontFamily: 'var(--font-mono)' }}>{op}</span>
                  ))}
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Pipeline 4: Publisher Market Share & Catalog Representation</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Groups by publishing house to compute total title counts and physical inventory holdings.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleExpand('p4')}
                >
                  <FileCode size={14} /> {expandedPipeline === 'p4' ? 'Hide Pipeline' : 'View Pipeline JSON'}
                </button>
                {pipeline4?.query && <QueryBadge query={pipeline4.query} />}
              </div>
            </div>

            {expandedPipeline === 'p4' && (
              <pre className="code-block" style={{ marginBottom: '1.5rem' }}>
                <code>{pipeline4.query?.query_text}</code>
              </pre>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {pipeline4?.data?.map(p => (
                <div key={p.publisher} style={{
                  background: 'rgba(15, 22, 38, 0.7)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '0.94rem', display: 'block', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>
                      {p.publisher}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>★ {p.avg_rating}</span>
                  </div>
                  <span className="badge badge-mongo">
                    {p.titles} titles
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PIPELINE 6: MULTI-FACETED INVENTORY ($facet) */}
          <div className="glass-panel" style={{ padding: '2.25rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.45rem' }}>
                  {pipeline6?.operators?.map(op => (
                    <span key={op} className="badge badge-mongo" style={{ fontFamily: 'var(--font-mono)' }}>{op}</span>
                  ))}
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Pipeline 6: Multi-Faceted Inventory Breakdown ($facet)</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Executes multiple sub-pipelines concurrently in a single round-trip using <code>$facet</code>.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => toggleExpand('p6')}
                >
                  <FileCode size={14} /> {expandedPipeline === 'p6' ? 'Hide Pipeline' : 'View Pipeline JSON'}
                </button>
                {pipeline6?.query && <QueryBadge query={pipeline6.query} />}
              </div>
            </div>

            {expandedPipeline === 'p6' && (
              <pre className="code-block" style={{ marginBottom: '1.5rem' }}>
                <code>{pipeline6.query?.query_text}</code>
              </pre>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.75rem' }}>
              {/* Facet Sub-Query 1: Top Rated */}
              <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.45rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem', color: '#fbbf24' }}>
                  Top Rated Titles Sub-Query
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {pipeline6?.top_rated?.map(b => (
                    <div key={b.title} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>
                        {b.title}
                      </span>
                      <strong style={{ color: '#fbbf24' }}>★ {b.avg_rating}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facet Sub-Query 2: Inventory Ratio */}
              <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.45rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem', color: '#34d399' }}>
                  Physical Inventory Summary Sub-Query
                </h4>
                {pipeline6?.availability_overview?.[0] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Catalog Titles:</span>
                      <strong style={{ color: '#fff' }}>{pipeline6.availability_overview[0].total_titles}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Physical Copies:</span>
                      <strong style={{ color: '#fff' }}>{pipeline6.availability_overview[0].total_copies}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Available on Shelf:</span>
                      <strong style={{ color: '#34d399' }}>{pipeline6.availability_overview[0].available_copies}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Facet Sub-Query 3: Language Diversity */}
              <div style={{ background: 'rgba(15, 22, 38, 0.7)', padding: '1.45rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem', color: '#38bdf8' }}>
                  Language Diversity Sub-Query
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {pipeline6?.by_language?.map(l => (
                    <div key={l._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{l._id}</span>
                      <strong style={{ color: '#fff' }}>{l.count} books</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
