import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const CategorySelector = ({ onStart }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [userNote, setUserNote] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/knowledge-base/learn/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const toggleSelect = (pageId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const toggleAllInCategory = (category) => {
    // Include the root page itself + all children
    const allIds = [category._id, ...category.children.map(c => c._id)];
    const allSelected = allIds.every(id => selected.has(id));

    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach(id => next.delete(id));
      } else {
        allIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleStart = () => {
    onStart({
      pageIds: Array.from(selected),
      userNote: userNote.trim()
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-900 dark:border-white border-t-transparent dark:border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full px-8 md:px-12 lg:px-16 pt-16 pb-12"
    >
      {/* Header */}
      <div className="mb-10">
        <span className="text-5xl leading-none mb-3 block">
          <GraduationCap size={48} className="text-gray-900 dark:text-white" />
        </span>
        <h1 className="text-[36px] font-bold text-gray-900 dark:text-white tracking-[-0.025em] leading-[1.15] mb-3">
          Learn Mode
        </h1>
        <p className="text-[15px] text-gray-500 dark:text-neutral-400 leading-relaxed">
          Select the topics you want to study. We'll generate a quiz based on the knowledge base content to test your understanding.
        </p>
      </div>

      {/* Categories as cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
        {categories.map(category => {
          const allIds = [category._id, ...category.children.map(c => c._id)];
          const selectedCount = allIds.filter(id => selected.has(id)).length;
          const allSelected = allIds.length > 0 && selectedCount === allIds.length;

          return (
            <div
              key={category._id}
              className={`border rounded-xl overflow-hidden transition-colors ${
                selectedCount > 0
                  ? 'border-blue-200 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10'
                  : 'border-gray-100 dark:border-neutral-800'
              }`}
            >
              {/* Category card header — selectable */}
              <label className="flex items-center gap-3 px-4 py-3 cursor-pointer
                bg-gray-50/80 dark:bg-neutral-900/50 hover:bg-gray-100/80 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(category._id)}
                  onChange={() => toggleSelect(category._id)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600
                    text-blue-600 focus:ring-blue-500 dark:bg-neutral-800 shrink-0"
                />
                <span className="text-lg leading-none">{category.icon || '📁'}</span>
                <span className={`text-[14px] font-semibold truncate flex-1 ${
                  selected.has(category._id)
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-neutral-200'
                }`}>
                  {category.title}
                </span>
                {selectedCount > 0 && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30
                    text-blue-700 dark:text-blue-300 font-medium shrink-0">
                    {selectedCount}
                  </span>
                )}
              </label>

              {/* Children list */}
              {category.children.length > 0 && (
                <div className="px-2 py-1.5">
                  {category.children.map(child => (
                    <label
                      key={child._id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors
                        ${selected.has(child._id)
                          ? 'bg-blue-50/80 dark:bg-blue-900/15'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-800/30'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(child._id)}
                        onChange={() => toggleSelect(child._id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-neutral-600
                          text-blue-600 focus:ring-blue-500 dark:bg-neutral-800 shrink-0"
                      />
                      <span className="text-sm leading-none shrink-0">{child.icon || '📄'}</span>
                      <span className={`text-[13px] truncate ${
                        selected.has(child._id)
                          ? 'text-gray-900 dark:text-white font-medium'
                          : 'text-gray-600 dark:text-neutral-300'
                      }`}>
                        {child.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Select all toggle at bottom */}
              {allIds.length > 1 && (
                <div className="px-3 pb-2">
                  <button
                    onClick={() => toggleAllInCategory(category)}
                    className="w-full text-[12px] py-1.5 rounded-md text-gray-500 dark:text-neutral-400
                      hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors font-medium"
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 dark:text-neutral-500">
            <p className="text-[15px]">No knowledge base pages available yet.</p>
          </div>
        )}
      </div>

      {/* Additional Note + Start - side by side on wider screens */}
      <div className="max-w-4xl">
        <div className="mb-6">
          <label className="block text-[13px] font-medium text-gray-700 dark:text-neutral-300 mb-2">
            What do you want to focus on? (optional)
          </label>
          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder="E.g., I'm confused about the deposit verification steps and account closure process..."
            rows={3}
            className="w-full px-4 py-3 text-[14px] bg-gray-50/80 dark:bg-neutral-900/50
              border border-gray-200 dark:border-neutral-700 rounded-xl
              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
              dark:focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={selected.size === 0}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
            text-[15px] font-semibold transition-all
            ${selected.size > 0
              ? 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
            }`}
        >
          <GraduationCap size={18} />
          Start Quiz
          {selected.size > 0 && (
            <span className="text-[13px] opacity-70 ml-1">
              ({selected.size} {selected.size === 1 ? 'topic' : 'topics'})
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default CategorySelector;
