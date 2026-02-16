import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Edit, ArrowLeft, Clock } from 'lucide-react';
import { useKnowledgeBase } from '../../context/KnowledgeBaseContext';
import BlockRenderer from '../../components/KnowledgeBase/BlockRenderer';
import KBTableOfContents from '../../components/KnowledgeBase/KBTableOfContents';

// Page theme classes
const pageThemeClasses = {
  '': '',
  'docs': 'kb-theme-docs',
  'wiki': 'kb-theme-wiki',
  'minimal': 'kb-theme-minimal',
};

// Reading time estimate
const estimateReadingTime = (blocks) => {
  let text = '';
  const extractText = (content) => {
    if (typeof content === 'string') {
      const tmp = document.createElement('div');
      tmp.innerHTML = content;
      return (tmp.textContent || '') + ' ';
    }
    if (content && typeof content === 'object') {
      if (typeof content.text === 'string') text += content.text + ' ';
      if (typeof content.title === 'string') text += content.title + ' ';
      if (typeof content.body === 'string') text += content.body + ' ';
      if (typeof content.code === 'string') text += content.code + ' ';
      if (Array.isArray(content.headers)) content.headers.forEach(h => { text += h + ' '; });
      if (Array.isArray(content.rows)) content.rows.forEach(row => {
        if (Array.isArray(row)) row.forEach(cell => {
          text += (typeof cell === 'string' ? cell : cell?.content || '') + ' ';
        });
      });
      if (Array.isArray(content.columns)) content.columns.forEach(col => {
        if (Array.isArray(col.blocks)) col.blocks.forEach(b => extractText(b.defaultContent));
      });
      if (Array.isArray(content.blocks)) content.blocks.forEach(b => extractText(b.defaultContent));
      if (Array.isArray(content.entries)) content.entries.forEach(e => {
        text += (e.title || '') + ' ';
        if (Array.isArray(e.blocks)) e.blocks.forEach(b => extractText(b.defaultContent));
      });
    }
    return '';
  };
  (blocks || []).forEach(b => { text += extractText(b.defaultContent); });
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
};

const KBPageView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPage, pageLoading, loadPage, isAdmin } = useKnowledgeBase();
  const [showBackToLearn, setShowBackToLearn] = useState(false);

  // Load page when slug changes
  useEffect(() => {
    if (slug) {
      loadPage(slug);
    }
  }, [slug, loadPage]);

  // Check if coming from Learn mode
  useEffect(() => {
    if (localStorage.getItem('kb_learn_return')) {
      setShowBackToLearn(true);
    }
  }, []);

  // Scroll to heading after page loads (hash-based navigation)
  useEffect(() => {
    if (currentPage && location.hash) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        const elementId = location.hash.slice(1);
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentPage, location.hash]);

  const handleBackToLearn = () => {
    localStorage.removeItem('kb_learn_return');
    setShowBackToLearn(false);
    navigate('/knowledge-base/learn');
  };

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

      {/* Content + Table of Contents */}
      <div className={`flex w-full ${pageThemeClasses[currentPage.pageSettings?.theme || ''] || ''}`}>
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className={`w-full px-8 md:px-12 lg:px-16 pt-16 pb-12 mx-auto ${currentPage.pageSettings?.fullWidth ? '' : 'max-w-6xl'}`}>
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
                {/* Reading time */}
                {currentPage.blocks && currentPage.blocks.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 text-[13px] text-gray-400 dark:text-neutral-500">
                    <Clock size={13} />
                    <span>{estimateReadingTime(currentPage.blocks)} min read</span>
                  </div>
                )}
              </div>
            </div>

            {/* Page Blocks */}
            <div data-kb-content className="[&>div:first-child>h1]:mt-0 [&>div:first-child>h2]:mt-0 [&>div:first-child>h3]:mt-0">
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
        </div>

        {/* Table of Contents Sidebar */}
        <KBTableOfContents blocks={currentPage.blocks} />
      </div>

      {/* Theme styles */}
      <style>{`
        .kb-theme-docs [data-kb-content] { font-size: 15px; line-height: 1.7; }
        .kb-theme-docs h1 { font-size: 32px !important; letter-spacing: -0.02em; }
        .kb-theme-docs h2 { font-size: 24px !important; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 8px; }

        .kb-theme-wiki [data-kb-content] { font-size: 14.5px; line-height: 1.65; }
        .kb-theme-wiki h1 { font-size: 28px !important; }
        .kb-theme-wiki h2 { font-size: 21px !important; }
        .kb-theme-wiki h3 { font-size: 17px !important; }

        .kb-theme-minimal [data-kb-content] { font-size: 16px; line-height: 1.8; }
        .kb-theme-minimal h1 { font-size: 30px !important; font-weight: 500 !important; letter-spacing: -0.03em; }
        .kb-theme-minimal h2 { font-size: 22px !important; font-weight: 500 !important; }
      `}</style>

      {/* Back to Learn floating button */}
      {showBackToLearn && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          onClick={handleBackToLearn}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5
            bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100
            text-white dark:text-gray-900 rounded-full shadow-lg
            text-[14px] font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Learn
        </motion.button>
      )}
    </motion.div>
  );
};

export default KBPageView;
