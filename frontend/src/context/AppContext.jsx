import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [role, setRole] = useState('librarian'); // 'librarian' | 'member'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBookId, setSelectedBookId] = useState(null);
  
  // Active member when viewing as member
  const [membersList, setMembersList] = useState([]);
  const [activeMemberId, setActiveMemberId] = useState('M0004');
  const [activeMember, setActiveMember] = useState(null);

  // Query Inspector Drawer / Modal state
  const [inspectQuery, setInspectQuery] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // System & DB connectivity status
  const [systemStatus, setSystemStatus] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const openQueryInspector = (queryData) => {
    if (queryData) {
      setInspectQuery(queryData);
      setIsInspectorOpen(true);
    }
  };

  const closeQueryInspector = () => {
    setIsInspectorOpen(false);
  };

  const navigateToBook = (bookId) => {
    setSelectedBookId(bookId);
    setActiveTab('book_detail');
  };

  // Load initial members and system status
  useEffect(() => {
    api.getMembers({ limit: 50 })
      .then(res => {
        setMembersList(res.members || []);
        if (res.members && res.members.length > 0) {
          const found = res.members.find(m => m.member_id === 'M0004') || res.members[0];
          setActiveMember(found);
          setActiveMemberId(found.member_id);
        }
      })
      .catch(console.error);

    api.getSystemOverview()
      .then(res => setSystemStatus(res))
      .catch(console.error);
  }, []);

  const changeActiveMember = (mId) => {
    setActiveMemberId(mId);
    const found = membersList.find(m => m.member_id === mId);
    if (found) {
      setActiveMember(found);
    }
  };

  return (
    <AppContext.Provider value={{
      role,
      setRole,
      activeTab,
      setActiveTab,
      selectedBookId,
      setSelectedBookId,
      navigateToBook,
      membersList,
      activeMemberId,
      activeMember,
      changeActiveMember,
      inspectQuery,
      isInspectorOpen,
      openQueryInspector,
      closeQueryInspector,
      systemStatus,
      setSystemStatus,
      toasts,
      addToast
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
