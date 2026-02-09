import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KnowledgeBaseProvider, useKnowledgeBase } from '../../context/KnowledgeBaseContext';
import KBSidebar from '../../components/KnowledgeBase/KBSidebar';
import FloatingNavbar from '../../components/KnowledgeBase/FloatingNavbar';
import FloatingSearchBar from '../../components/KnowledgeBase/search/FloatingSearchBar';

const KnowledgeBaseLayoutInner = () => {
  const { currentPage, fetchAllTags } = useKnowledgeBase();

  // Fetch tags for search filters
  useEffect(() => {
    if (fetchAllTags) fetchAllTags();
  }, [fetchAllTags]);

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
        {/* Floating Navbar - shows when page has dropdowns */}
        {currentPage?.dropdowns?.length > 0 && (
          <FloatingNavbar />
        )}

        {/* Search Bar - always visible */}
        <FloatingSearchBar />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
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
