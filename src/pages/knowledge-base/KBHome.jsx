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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full p-6"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Book size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Knowledge Base
            </h1>
            <p className="text-gray-500 dark:text-neutral-400">
              Customer support procedures and documentation
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-gray-500 dark:text-neutral-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalPages}
              </div>
              <div className="text-sm text-gray-500 dark:text-neutral-400">
                Total Pages
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <FolderOpen size={20} className="text-gray-500 dark:text-neutral-400" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {pageTree.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-neutral-400">
                Root Sections
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div
            onClick={() => navigate('/knowledge-base/admin')}
            className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-purple-600 dark:text-purple-400" />
              <div>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  Admin Panel
                </div>
                <div className="text-sm text-purple-500 dark:text-purple-500">
                  Manage pages & admins
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions for Admin */}
      {isAdmin && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/knowledge-base/admin')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Create New Page
            </button>
          </div>
        </div>
      )}

      {/* Recent Pages */}
      {recentPages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Browse Pages
          </h2>
          <div className="space-y-2">
            {recentPages.map(page => (
              <div
                key={page._id}
                onClick={() => navigate(`/knowledge-base/${page.slug}`)}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg
                  border border-gray-200 dark:border-neutral-800 cursor-pointer
                  hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <span className="text-xl">{page.icon || '📄'}</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {page.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pageTree.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 dark:text-neutral-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No pages yet
          </h3>
          <p className="text-gray-500 dark:text-neutral-400 mb-4">
            {isAdmin
              ? 'Get started by creating your first page.'
              : 'Pages will appear here once admins add content.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => navigate('/knowledge-base/admin')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Create First Page
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default KBHome;
