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
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
        <span>
          Showing <span className="font-medium text-gray-900 dark:text-white">{((currentPage - 1) * limit) + 1}</span> to{' '}
          <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * limit, totalItems)}</span> of{' '}
          <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> results
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2"
        >
          Previous
        </Button>

        {getPageNumbers().map((page, idx) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span key={page} className="px-2 text-gray-400 dark:text-neutral-500">
                ...
              </span>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
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
          className="px-2"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
