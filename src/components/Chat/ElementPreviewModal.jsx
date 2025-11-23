import React from 'react';
import { X, ExternalLink, Square, Circle, Type, ArrowRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ElementPreviewModal = ({ isOpen, onClose, element }) => {
  const navigate = useNavigate();

  if (!isOpen || !element) return null;

  const getElementIcon = (type) => {
    switch (type) {
      case 'title':
        return <Type className="w-6 h-6" />;
      case 'description':
        return <Type className="w-6 h-6" />;
      case 'macro':
        return <Square className="w-6 h-6" />;
      case 'example':
        return <MessageSquare className="w-6 h-6" />;
      default:
        return <Square className="w-6 h-6" />;
    }
  };

  const getElementTypeLabel = (type) => {
    switch (type) {
      case 'title':
        return 'Title Element';
      case 'description':
        return 'Description Element';
      case 'macro':
        return 'Macro Element';
      case 'example':
        return 'Example Element';
      default:
        return 'Workspace Element';
    }
  };

  const getElementColor = (type) => {
    switch (type) {
      case 'title':
        return 'from-blue-500 to-blue-600';
      case 'description':
        return 'from-gray-500 to-gray-600';
      case 'macro':
        return 'from-green-500 to-green-600';
      case 'example':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const handleGoToWorkspace = () => {
    const baseUrl = `/workspace/${element.workspaceId}?element=${element.elementId}`;
    // Add exampleIndex to URL if this is an example element and index is available
    const url = element.type === 'example' &&
                element.exampleIndex !== null &&
                element.exampleIndex !== undefined
      ? `${baseUrl}&exampleIndex=${element.exampleIndex}`
      : baseUrl;
    navigate(url);
    onClose();
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#1A1D21] shadow-2xl overflow-hidden flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className={`px-6 py-5 bg-gradient-to-r ${getElementColor(element.type)} text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                {getElementIcon(element.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold uppercase tracking-wider mb-1 opacity-90">
                  {getElementTypeLabel(element.type)}
                </div>
                <h2
                  className="text-[22px] font-bold mb-1 break-words"
                  dangerouslySetInnerHTML={{ __html: element.title || 'Untitled' }}
                />
                <div className="text-[13px] opacity-75">
                  From: {element.workspaceName || 'Unknown Workspace'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ overflowY: 'scroll' }}>
          <div className="space-y-6">
            {/* Title - Skip for macro and description types since it's already in header */}
            {element.title && element.type !== 'macro' && element.type !== 'description' && (
              <div>
                <div className="text-[12px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                  Title
                </div>
                <div
                  className="text-[16px] text-gray-900 dark:text-neutral-50 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: element.title }}
                />
              </div>
            )}

            {/* Preview/Content - Only for Title type */}
            {element.preview && element.type === 'title' && (
              <div>
                <div className="text-[12px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                  Content
                </div>
                <div
                  className="text-[15px] text-gray-700 dark:text-neutral-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: element.preview }}
                />
              </div>
            )}

            {/* Description - Only for Description type */}
            {element.description && element.type === 'description' && (
              <div>
                <div className="text-[12px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                  Description
                </div>
                <div
                  className="text-[15px] text-gray-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap break-words"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  dangerouslySetInnerHTML={{ __html: element.description }}
                />
              </div>
            )}

            {/* Macro Details - Only for Macro type */}
            {element.macro && element.type === 'macro' && (
              <div>
                <div className="text-[12px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                  Macro Details
                </div>
                <div
                  className="text-[15px] text-gray-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: element.macro }}
                />
              </div>
            )}

            {/* Example (for example type) */}
            {element.example && (
              <div>
                <div className="text-[12px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                  Example Conversation
                </div>
                {element.example.messages && element.example.messages.length > 0 ? (
                  <div className="space-y-3 bg-gray-50 dark:bg-neutral-900/50 rounded-lg p-4">
                    {element.example.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 ${
                          msg.type === 'user' ? 'justify-start' : 'justify-start'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${
                          msg.type === 'user'
                            ? 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {msg.type === 'user' ? 'U' : 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold mb-1 text-gray-600 dark:text-neutral-400">
                            {msg.type === 'user' ? 'User' : 'Agent'}
                          </div>
                          <div
                            className="text-[14px] text-gray-900 dark:text-neutral-100 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: msg.text }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[14px] text-gray-500 dark:text-neutral-500 italic">
                    No messages in this example
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-gray-50 dark:bg-neutral-900/50">
          <div className="text-[13px] text-gray-500 dark:text-neutral-500">
            Click to view full element in workspace
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[14px] font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleGoToWorkspace}
              className="px-4 py-2 text-[14px] font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>Open in Workspace</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementPreviewModal;
