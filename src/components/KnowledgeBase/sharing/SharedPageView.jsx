import React, { useState, useEffect } from 'react';
import { FileText, ChevronRight, AlertTriangle, Loader2, Home, ExternalLink } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = process.env.REACT_APP_API_URL || '';

// Standalone block renderer for shared pages (no context dependency)
const SharedBlockRenderer = ({ block }) => {
  const content = block.defaultContent;

  switch (block.type) {
    case 'paragraph':
      return (
        <div className="text-[15px] text-gray-800 dark:text-neutral-200 leading-relaxed my-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {typeof content === 'string' ? content : ''}
          </ReactMarkdown>
        </div>
      );

    case 'heading_1':
      return <h1 className="text-[28px] font-bold text-gray-900 dark:text-white mt-8 mb-3">{typeof content === 'string' ? content : ''}</h1>;
    case 'heading_2':
      return <h2 className="text-[22px] font-semibold text-gray-900 dark:text-white mt-6 mb-2">{typeof content === 'string' ? content : ''}</h2>;
    case 'heading_3':
      return <h3 className="text-[18px] font-medium text-gray-900 dark:text-white mt-4 mb-2">{typeof content === 'string' ? content : ''}</h3>;

    case 'bulleted_list':
    case 'numbered_list': {
      const items = typeof content === 'string' ? content.split('\n').filter(Boolean) : [];
      const Tag = block.type === 'numbered_list' ? 'ol' : 'ul';
      return (
        <Tag className={`my-2 pl-6 space-y-1 text-[15px] text-gray-800 dark:text-neutral-200 ${block.type === 'numbered_list' ? 'list-decimal' : 'list-disc'}`}>
          {items.map((item, i) => <li key={i}>{item.replace(/^[-*\d.]\s*/, '')}</li>)}
        </Tag>
      );
    }

    case 'callout': {
      const callout = typeof content === 'object' ? content : { text: content };
      const variant = block.properties?.variant || 'info';
      const variantStyles = {
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
        tip: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300'
      };
      return (
        <div className={`p-4 rounded-lg border my-3 text-[14px] ${variantStyles[variant] || variantStyles.info}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{callout.text || ''}</ReactMarkdown>
        </div>
      );
    }

    case 'quote':
      return (
        <blockquote className="border-l-4 border-gray-300 dark:border-neutral-600 pl-4 my-3 text-[15px] text-gray-600 dark:text-neutral-400 italic">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof content === 'string' ? content : ''}</ReactMarkdown>
        </blockquote>
      );

    case 'code': {
      const code = typeof content === 'object' ? content : { code: content, language: '' };
      return (
        <pre className="bg-gray-900 dark:bg-neutral-950 text-gray-100 rounded-lg p-4 my-3 overflow-x-auto text-[13px]">
          <code>{code.code || ''}</code>
        </pre>
      );
    }

    case 'divider':
      return <hr className="my-6 border-gray-200 dark:border-neutral-700" />;

    case 'image': {
      const img = typeof content === 'object' ? content : { url: content };
      if (!img.url) return null;
      return (
        <figure className="my-4">
          <img src={img.url} alt={img.alt || ''} className="max-w-full rounded-lg" />
          {img.caption && <figcaption className="mt-2 text-center text-[13px] text-gray-500">{img.caption}</figcaption>}
        </figure>
      );
    }

    case 'table': {
      const table = typeof content === 'object' ? content : { headers: [], rows: [] };
      if (!table.headers || table.headers.length === 0) return null;
      return (
        <div className="overflow-x-auto my-3">
          <table className="w-full text-[14px] border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-neutral-800">
                {table.headers.map((h, i) => (
                  <th key={i} className="px-4 py-2 text-left font-medium text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(table.rows || []).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2 text-gray-800 dark:text-neutral-200 border border-gray-200 dark:border-neutral-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'toggle': {
      const toggle = typeof content === 'object' ? content : { title: content, body: '' };
      return (
        <details className="my-2 group">
          <summary className="cursor-pointer text-[15px] font-medium text-gray-800 dark:text-neutral-200 hover:text-blue-600">
            {toggle.title || 'Toggle'}
          </summary>
          <div className="pl-5 mt-2 text-[14px] text-gray-700 dark:text-neutral-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{toggle.body || ''}</ReactMarkdown>
          </div>
        </details>
      );
    }

    default:
      return null;
  }
};

const SharedPageView = ({ token }) => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/knowledge-base/shared/${token}`);
        setPage(response.data);
      } catch (err) {
        if (err.response?.status === 410) {
          setError('This share link has expired.');
        } else if (err.response?.status === 404) {
          setError('Page not found. The share link may have been revoked.');
        } else {
          setError('Failed to load the shared page.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-[14px] text-gray-500">Loading shared page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="text-center max-w-md mx-4">
          <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white mb-2">Unable to Access Page</h2>
          <p className="text-[14px] text-gray-500 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Shared page banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[13px] text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
            <ExternalLink size={14} />
            Shared Page
          </span>
          {page.createdBy && (
            <span className="text-[12px] text-blue-500 dark:text-blue-400">
              by {page.createdBy.name}
            </span>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      {page.breadcrumbs && page.breadcrumbs.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <nav className="flex items-center gap-1.5 text-[13px] text-gray-400">
            <Home size={13} />
            {page.breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <ChevronRight size={11} />
                <span className={i === page.breadcrumbs.length - 1 ? 'text-gray-600 dark:text-neutral-300' : ''}>
                  {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                  {crumb.title}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>
      )}

      {/* Page content */}
      <article className="max-w-4xl mx-auto px-6 py-8">
        {/* Cover */}
        {page.coverImage && (
          <div className="mb-8 -mx-6 -mt-2">
            <img
              src={page.coverImage}
              alt="Cover"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Title */}
        <div className="mb-8">
          {page.icon && <span className="text-[48px] mb-2 block">{page.icon}</span>}
          <h1 className="text-[36px] font-bold text-gray-900 dark:text-white leading-tight">
            {page.title}
          </h1>
          {page.tags && page.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {page.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-[12px] bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Blocks */}
        <div className="space-y-1">
          {page.blocks?.map(block => (
            <SharedBlockRenderer key={block.id} block={block} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-gray-200 dark:border-neutral-800">
          <p className="text-[12px] text-gray-400 dark:text-neutral-600 text-center">
            Shared from Knowledge Base
          </p>
        </div>
      </article>
    </div>
  );
};

export default SharedPageView;
