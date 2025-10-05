import React, { useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import logoBlack from '../assets/images/LOGO-MAIN-BLACK.png';
import logoWhite from '../assets/images/LOGO-MAIN-WHITE.png';

const HashExplorerFinder = () => {
  const { theme } = useTheme();
  const [hash, setHash] = useState('');
  const [result, setResult] = useState({ message: '', type: '' });
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hash.trim()) {
      setResult({ message: 'Please enter a transaction hash', type: 'error' });
      return;
    }

    const trimmedHash = hash.trim();
    setLoading(true);
    setResult({ message: 'Searching for transaction...', type: 'info' });

    try {
      // Call backend API
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/transaction/lookup`,
        { hash: trimmedHash }
      );

      if (response.data.success) {
        setTransactionData(response.data.data);
        setResult({ message: 'Transaction found!', type: 'success' });

        // Also open OKLink
        const oklinkUrl = `https://www.oklink.com/multi-search#key=${trimmedHash}`;
        window.open(oklinkUrl, '_blank');
      }
    } catch (error) {
      console.error('Transaction lookup error:', error);
      setResult({
        message: error.response?.data?.message || 'Failed to find transaction. Opening OKLink...',
        type: 'error'
      });

      // Still open OKLink even if API fails
      const oklinkUrl = `https://www.oklink.com/multi-search#key=${trimmedHash}`;
      window.open(oklinkUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8 relative">
      {/* Logo in top left corner */}
      <div className="absolute top-8 left-8 z-10">
        <img src={theme === 'dark' ? logoWhite : logoBlack} alt="Logo" className="h-8" />
      </div>

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-7xl flex gap-6">
          {/* Left Panel - Input */}
          <div className="flex-1 space-y-8">
            <div className="p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-lg">
            <div className="mb-8">
              <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-neutral-50">
                Hash Explorer Finder
              </h2>
              <p className="mt-4 text-center text-sm text-gray-600 dark:text-neutral-400">
                Enter any transaction hash to find and open the right blockchain explorer
              </p>
            </div>

            {result.message && (
              <div className={`
                px-4 py-3 rounded mb-6 text-sm
                ${result.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : ''}
                ${result.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : ''}
                ${result.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : ''}
              `}>
                {result.message}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="hash" className="block text-sm font-medium text-gray-900 dark:text-neutral-50">
                  Transaction Hash
                </label>
                <input
                  id="hash"
                  name="hash"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono text-sm"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="0x1234... or any transaction hash"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 dark:bg-neutral-50 dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Find Transaction'}
                </button>
              </div>
            </form>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-800">
                <h3 className="text-sm font-medium text-gray-900 dark:text-neutral-50 mb-3">
                  Supported Blockchains
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'opBNB', 'Optimism', 'Avalanche', 'Base'].map((chain) => (
                    <span
                      key={chain}
                      className="px-3 py-1 bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-neutral-50 rounded-full text-xs"
                    >
                      {chain}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Transaction Details */}
          <div className="flex-1">
            <div className="p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-lg h-full">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-50 mb-6">
                Transaction Details
              </h2>

              {!transactionData ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-600 dark:text-neutral-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Enter a transaction hash to view details</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Hash</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-neutral-50 break-all">{transactionData.hash}</p>
                  </div>

                  <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Network</p>
                    <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-neutral-50 rounded-full text-sm font-medium">
                      {transactionData.network}
                    </span>
                  </div>

                  <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">From Address</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-neutral-50 break-all">{transactionData.from}</p>
                  </div>

                  <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">To Address</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-neutral-50 break-all">{transactionData.to}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                      <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Token</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{transactionData.token}</p>
                    </div>

                    <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                      <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Amount</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{transactionData.amount}</p>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Time</p>
                    <p className="text-sm text-gray-900 dark:text-neutral-50">{transactionData.time}</p>
                  </div>

                  <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                    <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Transaction Fee</p>
                    <p className="text-sm text-gray-900 dark:text-neutral-50">{transactionData.transactionFee} {transactionData.token}</p>
                  </div>

                  {transactionData.status && (
                    <div className="pb-3">
                      <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        transactionData.status === 'success'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {transactionData.status}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashExplorerFinder;
