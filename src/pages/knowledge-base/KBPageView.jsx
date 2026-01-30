import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Edit } from 'lucide-react';
import { useKnowledgeBase } from '../../context/KnowledgeBaseContext';
import BlockRenderer from '../../components/KnowledgeBase/BlockRenderer';

const KBPageView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentPage, pageLoading, loadPage, isAdmin } = useKnowledgeBase();

  // Load page when slug changes
  useEffect(() => {
    if (slug) {
      loadPage(slug);
    }
  }, [slug, loadPage]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Page not found
        </h2>
        <p className="text-gray-500 dark:text-neutral-400 mb-4">
          The page you're looking for doesn't exist or has been deleted.
        </p>
        <button
          onClick={() => navigate('/knowledge-base')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full"
    >
      {/* Cover Image */}
      {currentPage.coverImage && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img
            src={currentPage.coverImage}
            alt={currentPage.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content Area */}
      <div className="px-6 py-6">
        {/* Breadcrumbs */}
        {currentPage.breadcrumbs && currentPage.breadcrumbs.length > 1 && (
          <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400 mb-4">
            {currentPage.breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.slug}>
                {index > 0 && <ChevronRight size={14} />}
                <button
                  onClick={() => navigate(`/knowledge-base/${crumb.slug}`)}
                  className={`hover:text-gray-700 dark:hover:text-neutral-200 transition-colors ${
                    index === currentPage.breadcrumbs.length - 1
                      ? 'text-gray-900 dark:text-white font-medium'
                      : ''
                  }`}
                >
                  {crumb.title}
                </button>
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Page Header */}
        <div className="flex items-start gap-4 mb-8">
          <span className="text-4xl">{currentPage.icon || '📄'}</span>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentPage.title}
              </h1>
              {isAdmin && (
                <button
                  onClick={() => navigate(`/knowledge-base/admin?edit=${currentPage._id}`)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
                    hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Edit page"
                >
                  <Edit size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page Blocks */}
        <div className="space-y-1" data-kb-content>
          {currentPage.blocks && currentPage.blocks.length > 0 ? (
            currentPage.blocks.map((block, index) => (
              <BlockRenderer key={block.id || index} block={block} />
            ))
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-neutral-400">
              {isAdmin ? (
                <p>
                  This page is empty.{' '}
                  <button
                    onClick={() => navigate(`/knowledge-base/admin?edit=${currentPage._id}`)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Add content
                  </button>
                </p>
              ) : (
                <p>This page doesn't have any content yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Page Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-neutral-800">
          <div className="text-sm text-gray-500 dark:text-neutral-400">
            {currentPage.lastModifiedBy && (
              <p>
                Last updated by {currentPage.lastModifiedBy.name || currentPage.lastModifiedBy.email}
                {currentPage.updatedAt && (
                  <span>
                    {' '}on {new Date(currentPage.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default KBPageView;
