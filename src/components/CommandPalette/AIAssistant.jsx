import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import ResultCard from './ResultCard';

const AIAssistant = ({ workspaces = [], activeFilters, resultsCount, onElementSelect, onBookmarkCreate, onClose, sessionId, onBackToList }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI search assistant. I can help you find anything in your workspaces. What are you looking for?",
      searchResults: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load session if sessionId provided
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      // Create new session
      createNewSession();
    }
  }, [sessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const createNewSession = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/canvas/chat-sessions`,
        { title: 'New Chat' },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setCurrentSessionId(response.data._id);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create chat session');
    }
  };

  const loadSession = async (sessId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/canvas/chat-sessions/${sessId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setMessages(response.data.messages);
      setCurrentSessionId(response.data._id);
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load chat');
    }
  };

  const saveMessage = async (message, searchResults) => {
    if (!currentSessionId) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/canvas/chat-sessions/${currentSessionId}/messages`,
        { message, searchResults },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to chat
    const userMsg = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);

    // Save user message to session
    await saveMessage(userMsg, []);

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Prepare conversation history for API (exclude current message, it's in the request)
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Prepare context
      const context = {
        resultsCount: resultsCount || 0,
        activeFilters: {
          elementTypes: activeFilters?.elementTypes || [],
          workspaceIds: activeFilters?.workspaceIds || [],
          dateRange: activeFilters?.dateRange || null
        }
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/canvas/ai-assistant`,
        {
          message: userMessage,
          conversationHistory,
          context
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Add assistant response to chat WITH search results
      const assistantMessage = response.data.message || "I'm sorry, I couldn't process that request.";
      const searchResults = response.data.searchResults || [];

      const assistantMsg = {
        role: 'assistant',
        content: assistantMessage,
        searchResults: searchResults
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Save assistant message to session
      await saveMessage(assistantMsg, searchResults);

      // Handle suggestions if provided
      if (response.data.suggestedQuery) {
        toast.info(`Try searching: "${response.data.suggestedQuery}"`);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again."
        }
      ]);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleElementClick = (result) => {
    onElementSelect?.(result);
    onClose?.(); // Close modal after selecting element
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back Arrow */}
      {onBackToList && (
        <div className="p-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
          <button
            onClick={onBackToList}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Chats
          </button>
        </div>
      )}

      {/* Messages - with fixed scroll area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent"
        style={{ maxHeight: onBackToList ? 'calc(85vh - 240px)' : 'calc(85vh - 180px)' }}>
        {messages.map((message, index) => (
          <div key={index}>
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={12} className="text-purple-500 dark:text-purple-400" />
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      AI Assistant
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>

            {/* Search Results - Klikabilni elementi */}
            {message.role === 'assistant' && message.searchResults && message.searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium text-gray-600 dark:text-neutral-400 px-2">
                  Found {message.searchResults.length} result{message.searchResults.length !== 1 ? 's' : ''}:
                </div>
                {message.searchResults.map((result) => (
                  <div key={result._id} className="transform transition-all">
                    <ResultCard
                      result={result}
                      isSelected={false}
                      onClick={() => handleElementClick(result)}
                      workspaceName={result.workspaceName}
                      onBookmark={onBookmarkCreate}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-neutral-400">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom */}
      <div className="border-t border-gray-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your workspaces..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Send size={14} />
            Send
          </button>
        </form>

        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2">
          Tip: Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
