import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KnowledgeBaseProvider, useKnowledgeBase } from '../../context/KnowledgeBaseContext';
import KBSidebar from '../../components/KnowledgeBase/KBSidebar';
import FloatingNavbar from '../../components/KnowledgeBase/FloatingNavbar';
import SearchModal from '../../components/KnowledgeBase/search/SearchModal';

const KnowledgeBaseLayoutInner = () => {
  const { currentPage, searchPages, searchSuggestions, allTags, fetchAllTags, recentPages } = useKnowledgeBase();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  // Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch tags for search filters
  useEffect(() => {
    if (fetchAllTags) fetchAllTags();
  }, [fetchAllTags]);

  const handleSearchNavigate = useCallback((slug) => {
    if (slug) navigate(`/knowledge-base/${slug}`);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex h-full w-full bg-white dark:bg-neutral-950"
    >
      {/* Sidebar */}
      <KBSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Floating Navbar - shows when page has dropdowns (handles own show/hide toggle) */}
        {currentPage?.dropdowns?.length > 0 && (
          <FloatingNavbar />
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <SearchModal
          onSearch={searchPages}
          onSuggestions={searchSuggestions}
          onNavigate={handleSearchNavigate}
          recentSearches={(recentPages || []).slice(0, 5).map(item => {
            const page = item.page || item;
            return { _id: page._id, title: page.title, slug: page.slug, icon: page.icon };
          })}
          allTags={allTags || []}
          onClose={() => setShowSearch(false)}
        />
      )}
    </motion.div>
  );
};

const KnowledgeBaseLayout = () => {
  return (
    <KnowledgeBaseProvider>
      <KnowledgeBaseLayoutInner />
    </KnowledgeBaseProvider>
  );
};

export default KnowledgeBaseLayout;
