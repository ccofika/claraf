import React, { useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import logoBlack from '../assets/images/LOGO-MAIN-BLACK.png';
import logoWhite from '../assets/images/LOGO-MAIN-WHITE.png';
import { Search, Gift, AlertCircle } from 'lucide-react';

const AffiliateBonusFinder = () => {
  const { theme } = useTheme();
  const [affiliateName, setAffiliateName] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [requiresCampaignId, setRequiresCampaignId] = useState(false);
  const [showCampaignInput, setShowCampaignInput] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!affiliateName.trim()) {
      setError('Please enter an affiliate name');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setRequiresCampaignId(false);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/google-sheets/search-affiliate`,
        {
          affiliateName: affiliateName.trim(),
          campaignId: campaignId.trim() || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.requiresCampaignId) {
        setRequiresCampaignId(true);
        setShowCampaignInput(true);
        setError(response.data.message);
      } else if (response.data.success) {
        setResults(response.data.results);
        setShowCampaignInput(false);
      }
    } catch (err) {
      console.error('Search error:', err);

      if (err.response?.data?.needsReauth) {
        setError('Google authentication expired. Please log out and log back in to refresh your access.');
      } else {
        setError(err.response?.data?.message || 'Failed to search affiliate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAffiliateName('');
    setCampaignId('');
    setResults([]);
    setError('');
    setRequiresCampaignId(false);
    setShowCampaignInput(false);
  };

  const renderDBResult = (result) => (
    <div key={`db-${result.affiliateName}`} className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="text-gray-900 dark:text-neutral-50" size={20} />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
          Deposit Bonus (DB)
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
          <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Bonus Status</p>
          <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.bonusStatus || 'N/A'}</p>
        </div>

        <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
          <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Affiliate Name</p>
          <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.affiliateName}</p>
        </div>

        {result.campaignId && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Campaign ID</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.campaignId}</p>
          </div>
        )}

        {result.percentage && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Percentage</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.percentage}</p>
          </div>
        )}

        {result.wager && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Wager</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.wager}</p>
          </div>
        )}

        {result.minDeposit && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Min Deposit</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.minDeposit}</p>
          </div>
        )}

        {result.maxDeposit && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Max Deposit</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.maxDeposit}</p>
          </div>
        )}

        {result.managedBy && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Managed By</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.managedBy}</p>
          </div>
        )}

        {result.language && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Language</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.language}</p>
          </div>
        )}

        {result.kycRequirement && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">KYC Requirement</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.kycRequirement}</p>
          </div>
        )}

        {result.platformMethod && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Platform/Method of Contact</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.platformMethod}</p>
          </div>
        )}

        {result.contactInstructions && (
          <div className="col-span-2 pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Contact Instructions</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50 whitespace-pre-wrap">{result.contactInstructions}</p>
          </div>
        )}

        {result.importantNote && (
          <div className="col-span-2 pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Important Note</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50 whitespace-pre-wrap">{result.importantNote}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderWBResult = (result) => (
    <div key={`wb-${result.affiliateName}`} className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="text-gray-900 dark:text-neutral-50" size={20} />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
          Welcome Bonus (WB)
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
          <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Bonus Status</p>
          <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.bonusStatus || 'N/A'}</p>
        </div>

        <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
          <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Affiliate Name</p>
          <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.affiliateName}</p>
        </div>

        {result.campaignSpecific && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Campaign-Specific</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.campaignSpecific}</p>
          </div>
        )}

        {result.offer && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Offer</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.offer}</p>
          </div>
        )}

        {result.amount && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Amount</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.amount}</p>
          </div>
        )}

        {result.currency && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Currency If Applicable</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.currency}</p>
          </div>
        )}

        {result.days && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Days If Applicable</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.days}</p>
          </div>
        )}

        {result.depositRequirements && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Deposit Requirements</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.depositRequirements}</p>
          </div>
        )}

        {result.minimumWager && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Minimum Wager</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.minimumWager}</p>
          </div>
        )}

        {result.wagerRequirement && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Wager Requirement</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.wagerRequirement}</p>
          </div>
        )}

        {result.managedBy && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Managed By</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.managedBy}</p>
          </div>
        )}

        {result.language && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Language</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.language}</p>
          </div>
        )}

        {result.kycRequirement && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">KYC Requirement</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.kycRequirement}</p>
          </div>
        )}

        {result.platformMethod && (
          <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Platform/Method of Contact</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.platformMethod}</p>
          </div>
        )}

        {result.contactInstructions && (
          <div className="col-span-2 pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Contact Instructions</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50 whitespace-pre-wrap">{result.contactInstructions}</p>
          </div>
        )}

        {result.importantNotes && (
          <div className="col-span-2 pb-3 border-b border-gray-200 dark:border-neutral-800">
            <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Important Notes</p>
            <p className="text-sm font-medium text-gray-900 dark:text-neutral-50 whitespace-pre-wrap">{result.importantNotes}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8 relative">
      {/* Logo in top left corner */}
      <div className="absolute top-8 left-8 z-10">
        <img src={theme === 'dark' ? logoWhite : logoBlack} alt="Logo" className="h-8" />
      </div>

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-7xl flex gap-6">
          {/* Left Panel - Search */}
          <div className="flex-1 space-y-8">
            <div className="p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-lg h-[calc(100vh-160px)] flex flex-col">
              <div className="mb-8">
                <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-neutral-50">
                  Affiliate Bonus Finder
                </h2>
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-neutral-400">
                  Search for affiliate bonuses from the Stake.com database
                </p>
              </div>

              {error && (
                <div className={`px-4 py-3 rounded mb-6 text-sm flex items-start gap-2 ${
                  requiresCampaignId
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                }`}>
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label htmlFor="affiliateName" className="block text-sm font-medium text-gray-900 dark:text-neutral-50">
                    Affiliate Name *
                  </label>
                  <input
                    id="affiliateName"
                    name="affiliateName"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                    value={affiliateName}
                    onChange={(e) => setAffiliateName(e.target.value)}
                    placeholder="Enter affiliate name"
                  />
                </div>

                {showCampaignInput && (
                  <div>
                    <label htmlFor="campaignId" className="block text-sm font-medium text-gray-900 dark:text-neutral-50">
                      Campaign ID {requiresCampaignId && '*'}
                    </label>
                    <input
                      id="campaignId"
                      name="campaignId"
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                      value={campaignId}
                      onChange={(e) => setCampaignId(e.target.value)}
                      placeholder="Enter campaign ID (if applicable)"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 dark:bg-neutral-50 dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Search size={16} />
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-50 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                  >
                    Reset
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-800">
                <h3 className="text-sm font-medium text-gray-900 dark:text-neutral-50 mb-3">
                  How it works
                </h3>
                <ul className="space-y-2 text-xs text-gray-600 dark:text-neutral-400">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 dark:text-neutral-50">1.</span>
                    <span>Enter the affiliate name to search for bonuses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 dark:text-neutral-50">2.</span>
                    <span>If the affiliate has multiple campaign-specific offers, you'll be prompted to enter a Campaign ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-900 dark:text-neutral-50">3.</span>
                    <span>Results will show all matching bonuses from both Deposit Bonus (DB) and Welcome Bonus (WB) sheets</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1">
            <div className="p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-lg h-[calc(100vh-160px)] flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-50 mb-6">
                Search Results
              </h2>

              {results.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-600 dark:text-neutral-400">
                  <Gift size={64} className="mb-4 opacity-50" />
                  <p className="text-sm">Enter an affiliate name to search for bonuses</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                  {results.map((result) =>
                    result.source === 'DB' ? renderDBResult(result) : renderWBResult(result)
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

export default AffiliateBonusFinder;
