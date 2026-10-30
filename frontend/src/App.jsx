import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import QueryInspectorModal from './components/QueryInspectorModal';
import ToastContainer from './components/ToastContainer';

// Pages
import DashboardPage from './pages/DashboardPage';
import CataloguePage from './pages/CataloguePage';
import BookDetailPage from './pages/BookDetailPage';
import CirculationPage from './pages/CirculationPage';
import MembersPage from './pages/MembersPage';
import ManageBooksPage from './pages/ManageBooksPage';
import RecommendationsPage from './pages/RecommendationsPage';
import GraphExplorerPage from './pages/GraphExplorerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SystemPage from './pages/SystemPage';

function MainApp() {
  const { activeTab } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'catalogue':
        return <CataloguePage />;
      case 'book_detail':
        return <BookDetailPage />;
      case 'circulation':
        return <CirculationPage />;
      case 'members':
        return <MembersPage />;
      case 'manage_books':
        return <ManageBooksPage />;
      case 'recommendations':
        return <RecommendationsPage />;
      case 'graph_explorer':
        return <GraphExplorerPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'system':
        return <SystemPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main style={{ flex: 1 }}>
          {renderActivePage()}
        </main>
      </div>

      {/* Global Overlays */}
      <QueryInspectorModal />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
