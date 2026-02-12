import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Book, Plus, Settings, FileText, FolderOpen } from 'lucide-react';
import { useKnowledgeBase } from '../../context/KnowledgeBaseContext';

const KBHome = () => {
  const navigate = useNavigate();
  const { pageTree, isAdmin, loading } = useKnowledgeBase();

  // Count total pages
  const countPages = (nodes) => {
    let count = 0;
    nodes.forEach(node => {
      count++;
      if (node.children) {
        count += countPages(node.children);
      }
    });
    return count;
  };

  const totalPages = countPages(pageTree);

  // Get recent pages (first 5 from tree)
  const getRecentPages = (nodes, limit = 5) => {
    const pages = [];
    const traverse = (nodeList) => {
      for (const node of nodeList) {
        if (pages.length >= limit) break;
        pages.push(node);
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    traverse(nodes);
    return pages;
  };

  const recentPages = getRecentPages(pageTree);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-900 dark:border-white border-t-transparent dark:border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full"
    >
      <div className="w-full px-8 md:px-12 lg:px-16 pt-16 pb-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg">
              <Book size={22} className="text-gray-700 dark:text-neutral-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-[-0.02em]">
                Knowledge Base
              </h1>
              <p className="text-[15px] text-gray-500 dark:text-neutral-400 mt-0.5">
                Customer support procedures and documentation
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-5 bg-gray-50/50 dark:bg-neutral-900/50 rounded-xl border border-gray-100 dark:border-neutral-800/50">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-gray-400 dark:text-neutral-500" />
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {totalPages}
                </div>
                <div className="text-[13px] text-gray-500 dark:text-neutral-400 mt-0.5">
                  Total Pages
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gray-50/50 dark:bg-neutral-900/50 rounded-xl border border-gray-100 dark:border-neutral-800/50">
            <div className="flex items-center gap-3">
              <FolderOpen size={18} className="text-gray-400 dark:text-neutral-500" />
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {pageTree.length}
                </div>
                <div className="text-[13px] text-gray-500 dark:text-neutral-400 mt-0.5">
                  Root Sections
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div
              onClick={() => navigate('/knowledge-base/admin')}
              className="p-5 bg-gray-50/50 dark:bg-neutral-900/50 rounded-xl border border-gray-100 dark:border-neutral-800/50
                cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings size={18} className="text-gray-400 dark:text-neutral-500" />
                <div>
                  <div className="text-[15px] font-semibold text-gray-900 dark:text-white">
                    Admin Panel
                  </div>
                  <div className="text-[13px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    Manage pages & admins
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions for Admin */}
        {isAdmin && (
          <div className="mb-12">
            <button
              onClick={() => navigate('/knowledge-base/admin')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white
                hover:bg-gray-800 dark:hover:bg-gray-100
                text-white dark:text-gray-900 rounded-lg text-[14px] font-medium transition-colors"
            >
              <Plus size={16} />
              Create New Page
            </button>
          </div>
        )}

        {/* Browse Pages */}
        {recentPages.length > 0 && (
          <div>
            <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-gray-400 dark:text-neutral-500 mb-3">
              Browse Pages
            </h2>
            <div className="space-y-0.5">
              {recentPages.map(page => (
                <div
                  key={page._id}
                  onClick={() => navigate(`/knowledge-base/${page.slug}`)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer
                    hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors"
                >
                  <span className="text-xl">{page.icon || '📄'}</span>
                  <span className="text-[15px] text-gray-900 dark:text-white font-medium">
                    {page.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pageTree.length === 0 && (
          <div className="text-center py-16">
            <FileText size={40} className="mx-auto text-gray-300 dark:text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No pages yet
            </h3>
            <p className="text-[15px] text-gray-500 dark:text-neutral-400 mb-6">
              {isAdmin
                ? 'Get started by creating your first page.'
                : 'Pages will appear here once admins add content.'}
            </p>
            {isAdmin && (
              <button
                onClick={() => navigate('/knowledge-base/admin')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white
                  hover:bg-gray-800 dark:hover:bg-gray-100
                  text-white dark:text-gray-900 rounded-lg text-[14px] font-medium transition-colors"
              >
                <Plus size={16} />
                Create First Page
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KBHome;
