import React from 'react';
import { Clock, ExternalLink, Copy, Folder, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';

const RecentLinks = ({ recentLinks, onLinkClick, onNavigateToCategory }) => {
  if (!recentLinks || recentLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-muted-foreground/70" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Recent Links</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Links you've recently clicked will appear here for quick access
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentLinks.map((link) => (
        <div
          key={link._id}
          className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
        >
          <button
            onClick={() => onLinkClick(link)}
            className="flex-1 text-left flex items-center gap-3 min-w-0"
            title={link.url}
          >
            {/* Favicon or Icon */}
            <div className="flex-shrink-0">
              {link.customIcon ? (
                <img
                  src={link.customIcon}
                  alt=""
                  className="w-8 h-8 rounded object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : link.favicon ? (
                <img
                  src={link.favicon}
                  alt=""
                  className="w-6 h-6"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="p-2 bg-muted/50 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors"
                style={{ display: link.customIcon || link.favicon ? 'none' : 'flex' }}
              >
                {link.type === 'open' ? (
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                )}
              </div>
            </div>

            {/* Link Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {link.name}
                </p>
                {link.isPinned && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                    ⭐ Pinned
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                <span className="truncate max-w-[250px]">{link.url}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-muted-foreground/50">•</span>
                  <span className="whitespace-nowrap">
                    {link.clicks || 0} {link.clicks === 1 ? 'click' : 'clicks'}
                  </span>
                  {link.lastClicked && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(link.lastClicked), { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Category Badge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToCategory(link.categoryId);
                }}
                className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-muted/50 hover:bg-muted transition-colors"
                style={{ borderLeft: `3px solid ${link.categoryColor || '#3B82F6'}` }}
              >
                <Folder className="w-3 h-3" />
                <span>{link.categoryName}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};

export default RecentLinks;
