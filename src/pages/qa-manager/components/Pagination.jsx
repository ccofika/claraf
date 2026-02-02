import React from 'react';
import Button from './Button';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, limit = 50 }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-neutral-400">
        <span>
          <span className="hidden sm:inline">Showing </span>
          <span className="font-medium text-gray-900 dark:text-white">{((currentPage - 1) * limit) + 1}</span>
          <span className="hidden sm:inline"> to</span><span className="sm:hidden">-</span>
          <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * limit, totalItems)}</span>
          <span className="hidden sm:inline"> of</span><span className="sm:hidden">/</span>
          <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span>
          <span className="hidden sm:inline"> results</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-1.5 sm:px-2"
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">&lt;</span>
        </Button>

        {getPageNumbers().map((page, idx) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span key={page} className="px-1 sm:px-2 text-gray-400 dark:text-neutral-500">
                ...
              </span>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                currentPage === page
                  ? 'bg-black dark:bg-white text-white dark:text-black font-medium'
                  : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              {page}
            </button>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-1.5 sm:px-2"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">&gt;</span>
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
