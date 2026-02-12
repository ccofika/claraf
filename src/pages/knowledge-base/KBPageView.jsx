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
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-900 dark:border-white border-t-transparent dark:border-t-transparent" />
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Page not found
        </h2>
        <p className="text-[15px] text-gray-500 dark:text-neutral-400 mb-6">
          The page you're looking for doesn't exist or has been deleted.
        </p>
        <button
          onClick={() => navigate('/knowledge-base')}
          className="px-4 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100
            text-white dark:text-gray-900 rounded-lg text-[14px] font-medium transition-colors"
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
      <div className="w-full px-8 md:px-12 lg:px-16 pt-16 pb-12 max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        {currentPage.breadcrumbs && currentPage.breadcrumbs.length > 1 && (
          <nav className="flex items-center gap-1 text-[13px] text-gray-400 dark:text-neutral-500 mb-8">
            {currentPage.breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.slug}>
                {index > 0 && <ChevronRight size={12} className="text-gray-300 dark:text-neutral-600" />}
                <button
                  onClick={() => navigate(`/knowledge-base/${crumb.slug}`)}
                  className={`hover:text-gray-600 dark:hover:text-neutral-300 transition-colors ${
                    index === currentPage.breadcrumbs.length - 1
                      ? 'text-gray-600 dark:text-neutral-300 font-medium'
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
        <div className="group mb-8">
          <div className="mb-3">
            <span className="text-5xl leading-none">{currentPage.icon || '📄'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-[36px] font-bold text-gray-900 dark:text-white tracking-[-0.025em] leading-[1.15]">
                {currentPage.title}
              </h1>
              {isAdmin && (
                <button
                  onClick={() => navigate(`/knowledge-base/admin?edit=${currentPage._id}`)}
                  className="p-2 text-gray-300 dark:text-neutral-600 hover:text-gray-600 dark:hover:text-neutral-300
                    hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-all
                    opacity-0 group-hover:opacity-100"
                  title="Edit page"
                >
                  <Edit size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page Blocks */}
        <div data-kb-content>
          {currentPage.blocks && currentPage.blocks.length > 0 ? (
            currentPage.blocks.map((block, index) => (
              <BlockRenderer key={block.id || index} block={block} />
            ))
          ) : (
            <div className="py-12 text-center text-gray-400 dark:text-neutral-500">
              {isAdmin ? (
                <p className="text-[15px]">
                  This page is empty.{' '}
                  <button
                    onClick={() => navigate(`/knowledge-base/admin?edit=${currentPage._id}`)}
                    className="text-gray-900 dark:text-white hover:underline font-medium"
                  >
                    Add content
                  </button>
                </p>
              ) : (
                <p className="text-[15px]">This page doesn't have any content yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Page Footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-neutral-800/30">
          <div className="text-[13px] text-gray-400 dark:text-neutral-500">
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
