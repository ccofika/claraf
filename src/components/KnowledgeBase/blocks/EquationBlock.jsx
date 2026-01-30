import React, { useState, useEffect, useRef } from 'react';
import { FunctionSquare, AlertCircle } from 'lucide-react';

// KaTeX will be loaded dynamically
let katex = null;

const EquationBlock = ({ block, content, isEditing, onUpdate }) => {
  const [error, setError] = useState(null);
  const [katexLoaded, setKatexLoaded] = useState(false);
  const renderRef = useRef(null);

  // Content structure: { latex: string, displayMode: boolean }
  const equationData = typeof content === 'object' && content !== null
    ? content
    : { latex: content || '', displayMode: true };

  // Load KaTeX dynamically
  useEffect(() => {
    if (katex) {
      setKatexLoaded(true);
      return;
    }

    // Load KaTeX CSS
    if (!document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
    }

    // Load KaTeX JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    script.onload = () => {
      katex = window.katex;
      setKatexLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load KaTeX');
    };
    document.head.appendChild(script);
  }, []);

  // Render equation
  useEffect(() => {
    if (!katexLoaded || !katex || !renderRef.current || !equationData.latex) return;

    try {
      katex.render(equationData.latex, renderRef.current, {
        displayMode: equationData.displayMode !== false,
        throwOnError: false,
        errorColor: '#ef4444',
        trust: true
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [katexLoaded, equationData.latex, equationData.displayMode]);

  if (isEditing) {
    return (
      <div className="space-y-4 p-5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            LaTeX Equation
          </label>
          <textarea
            value={equationData.latex || ''}
            onChange={(e) => {
              setError(null);
              onUpdate?.({ ...equationData, latex: e.target.value });
            }}
            className="w-full px-3 py-2 text-[14px] bg-white dark:bg-neutral-800 font-mono
              border border-gray-200 dark:border-neutral-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="E = mc^2 or \int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"
            spellCheck={false}
          />
          <p className="mt-1.5 text-[12px] text-gray-400 dark:text-neutral-500">
            Use LaTeX syntax. Examples: x^2, \sqrt{'{x}'}, \frac{'{a}{b}'}, \sum_{'{i=1}'}^n
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={equationData.displayMode !== false}
              onChange={(e) => onUpdate?.({ ...equationData, displayMode: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[14px] text-gray-700 dark:text-neutral-300">
              Display mode (centered, larger)
            </span>
          </label>
        </div>

        {equationData.latex && (
          <div className="mt-3 p-4 bg-white dark:bg-neutral-800 rounded-lg">
            <p className="text-[12px] text-gray-500 dark:text-neutral-400 mb-3">Preview</p>
            {!katexLoaded ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-red-500 text-[14px]">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : (
              <div
                ref={renderRef}
                className={`${equationData.displayMode !== false ? 'text-center' : 'inline'}`}
              />
            )}
          </div>
        )}

        {/* Quick reference */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-[12px] font-medium text-blue-700 dark:text-blue-400 mb-2">Quick Reference</p>
          <div className="grid grid-cols-2 gap-2 text-[12px] font-mono text-blue-600 dark:text-blue-300">
            <span>x^2 → x²</span>
            <span>x_i → xᵢ</span>
            <span>\frac{'{a}{b}'} → a/b</span>
            <span>\sqrt{'{x}'} → √x</span>
            <span>\sum → Σ</span>
            <span>\int → ∫</span>
            <span>\alpha, \beta → α, β</span>
            <span>\infty → ∞</span>
          </div>
        </div>
      </div>
    );
  }

  if (!equationData.latex) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-100 dark:bg-neutral-800 rounded-lg">
        <div className="text-center">
          <FunctionSquare size={32} className="mx-auto text-gray-300 dark:text-neutral-600 mb-1" />
          <span className="text-[13px] text-gray-400 dark:text-neutral-500">No equation</span>
        </div>
      </div>
    );
  }

  if (!katexLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 text-[14px]">
        <AlertCircle size={16} />
        <span>Invalid equation: {error}</span>
      </div>
    );
  }

  return (
    <div
      className={`my-6 ${equationData.displayMode !== false ? 'text-center py-4' : 'inline'}`}
    >
      <div
        ref={renderRef}
        className="equation-block"
      />
    </div>
  );
};

export default EquationBlock;
