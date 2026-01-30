import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useKnowledgeBase } from '../../../context/KnowledgeBaseContext';

const BreadcrumbsBlock = ({ block, content, isEditing }) => {
  const { pages, currentPage } = useKnowledgeBase();

  // Build breadcrumb trail from current page up to root
  const buildBreadcrumbs = () => {
    if (!currentPage || !pages) return [];

    const crumbs = [];
    let page = currentPage;

    // Walk up the parent chain
    while (page) {
      crumbs.unshift({
        id: page._id,
        title: page.title || 'Untitled',
        icon: page.icon,
        slug: page.slug
      });

      if (page.parentPage) {
        // Find parent in flat page list
        page = findPageById(pages, page.parentPage);
      } else {
        page = null;
      }
    }

    return crumbs;
  };

  // Recursively find a page by ID in the page tree
  const findPageById = (pageList, id) => {
    if (!pageList || !Array.isArray(pageList)) return null;
    for (const p of pageList) {
      if (p._id === id || p._id?.toString() === id?.toString()) return p;
      if (p.children) {
        const found = findPageById(p.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const breadcrumbs = buildBreadcrumbs();

  if (isEditing) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <p className="text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
          Breadcrumbs Block
        </p>
        <div className="flex items-center gap-1.5 text-[14px]">
          <Home size={14} className="text-gray-400" />
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-500 dark:text-neutral-400">Parent Page</span>
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-700 dark:text-neutral-200 font-medium">Current Page</span>
        </div>
        <p className="mt-2 text-[12px] text-gray-400 dark:text-neutral-500">
          Breadcrumbs are auto-generated from the page hierarchy
        </p>
      </div>
    );
  }

  if (breadcrumbs.length === 0) {
    return (
      <nav className="flex items-center gap-1.5 text-[14px] py-2">
        <Home size={14} className="text-gray-400 dark:text-neutral-500" />
        <ChevronRight size={12} className="text-gray-300 dark:text-neutral-600" />
        <span className="text-gray-500 dark:text-neutral-400">Knowledge Base</span>
      </nav>
    );
  }

  return (
    <nav className="flex items-center flex-wrap gap-1 text-[14px] py-2" aria-label="Breadcrumb">
      <a
        href="/knowledge-base"
        className="flex items-center text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
      >
        <Home size={14} />
      </a>

      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={crumb.id}>
            <ChevronRight size={12} className="text-gray-300 dark:text-neutral-600 flex-shrink-0" />
            {isLast ? (
              <span className="text-gray-800 dark:text-neutral-200 font-medium truncate max-w-[200px]">
                {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                {crumb.title}
              </span>
            ) : (
              <a
                href={`/knowledge-base/${crumb.slug}`}
                className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200
                  transition-colors truncate max-w-[200px]"
              >
                {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                {crumb.title}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default BreadcrumbsBlock;
