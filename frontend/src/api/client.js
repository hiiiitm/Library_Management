const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `Request failed (${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Books & Catalogue
  getBooks: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') {
        q.append(k, v);
      }
    });
    return request(`/books?${q.toString()}`);
  },
  getCatalogueMeta: () => request('/books/metadata'),
  getBookDetail: (bookId) => request(`/books/${bookId}`),
  createBook: (data) => request('/books', { method: 'POST', body: JSON.stringify(data) }),
  updateBook: (bookId, data) => request(`/books/${bookId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBook: (bookId) => request(`/books/${bookId}`, { method: 'DELETE' }),

  // Members
  getMembers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/members?${q}`);
  },
  getMemberDetail: (memberId) => request(`/members/${memberId}`),
  createMember: (data) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (memberId, data) => request(`/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Circulation
  getLoans: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        q.append(k, v);
      }
    });
    return request(`/circulation/loans?${q.toString()}`);
  },
  checkoutBook: (bookId, memberId) => request('/circulation/checkout', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId, member_id: memberId })
  }),
  returnBook: (loanId) => request('/circulation/return', {
    method: 'POST',
    body: JSON.stringify({ loan_id: loanId })
  }),
  renewLoan: (loanId) => request('/circulation/renew', {
    method: 'POST',
    body: JSON.stringify({ loan_id: loanId })
  }),
  payFine: (loanId) => request('/circulation/pay-fine', {
    method: 'POST',
    body: JSON.stringify({ loan_id: loanId })
  }),
  getReservations: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/circulation/reservations?${q}`);
  },
  createReservation: (bookId, memberId) => request('/circulation/reservations', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId, member_id: memberId })
  }),
  cancelReservation: (resId) => request(`/circulation/reservations/${resId}`, { method: 'DELETE' }),
  addReview: (data) => request('/circulation/reviews', { method: 'POST', body: JSON.stringify(data) }),

  // Recommendations (Neo4j)
  getAlsoBorrowed: (bookId, limit = 6) => request(`/recommendations/also-borrowed/${bookId}?limit=${limit}`),
  getPersonalizedRecommendations: (memberId, limit = 8) => request(`/recommendations/member/${memberId}?limit=${limit}`),
  getSimilarGenres: (bookId, limit = 6) => request(`/recommendations/similar-genres/${bookId}?limit=${limit}`),
  getMoreByAuthor: (bookId, limit = 4) => request(`/recommendations/more-by-author/${bookId}?limit=${limit}`),
  getGenrePopularity: () => request('/recommendations/genre-popularity'),

  // Graph Explorer (Neo4j)
  getGraphNetwork: (viewType = 'authors', limit = 70) => request(`/graph/network?view_type=${viewType}&limit=${limit}`),
  getShortestPath: (a1, a2) => request(`/graph/shortest-path?author1_id=${a1}&author2_id=${a2}`),
  getConnectedAuthors: (limit = 10) => request(`/graph/connected-authors?limit=${limit}`),

  // Analytics (MongoDB)
  getDashboardKpi: () => request('/analytics/dashboard-kpi'),
  getPipelineGenres: () => request('/analytics/pipeline-1-genres'),
  getPipelineTrends: () => request('/analytics/pipeline-2-trends'),
  getPipelineBuckets: () => request('/analytics/pipeline-3-buckets'),
  getPipelinePublishers: () => request('/analytics/pipeline-4-publishers'),
  getPipelineFines: () => request('/analytics/pipeline-5-fines'),
  getPipelineFacet: () => request('/analytics/pipeline-6-facet'),

  // System & Inspector
  getSystemOverview: () => request('/system/overview'),
  getQueryHistory: (limit = 50, database = '') => {
    const q = new URLSearchParams({ limit, ...(database ? { database } : {}) }).toString();
    return request(`/system/queries?${q}`);
  },
  clearQueries: () => request('/system/queries', { method: 'DELETE' }),
  replayOutbox: () => request('/system/outbox/replay', { method: 'POST' }),
  rebuildGraph: () => request('/system/rebuild-graph', { method: 'POST' })
};
