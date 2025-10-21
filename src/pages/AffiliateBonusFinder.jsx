import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Gift, AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';

const AffiliateBonusFinder = () => {
  const [affiliateName, setAffiliateName] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [expandedCards, setExpandedCards] = useState({});
  const [selectedDB, setSelectedDB] = useState(null);
  const [selectedWB, setSelectedWB] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'db', 'wb'
  const [infoMessage, setInfoMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedBonusData, setSelectedBonusData] = useState({ db: null, wb: null });

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!affiliateName.trim()) {
      setError('Please enter an affiliate name');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setInfoMessage('');
    setSelectedDB(null);
    setSelectedWB(null);

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

      if (response.data.success) {
        setResults(response.data.results);

        // Check if there are multiple campaign-specific bonuses
        const hasCampaignSpecificBonuses = response.data.results.some(r =>
          (r.source === 'DB' && r.bonus) || (r.source === 'WB' && r.campaignSpecific)
        );

        if (hasCampaignSpecificBonuses && !campaignId) {
          setInfoMessage('This affiliate has campaign-specific bonuses. You can filter by Campaign ID for more specific results.');
        }
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
    setInfoMessage('');
    setExpandedCards({});
    setSelectedDB(null);
    setSelectedWB(null);
    setFilter('all');
  };

  const toggleCard = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleSelectCard = (cardId, source) => {
    if (source === 'DB') {
      setSelectedDB(selectedDB === cardId ? null : cardId);
    } else if (source === 'WB') {
      setSelectedWB(selectedWB === cardId ? null : cardId);
    }
  };

  const getFilteredResults = () => {
    if (filter === 'all') return results;
    if (filter === 'db') return results.filter(r => r.source === 'DB');
    if (filter === 'wb') return results.filter(r => r.source === 'WB');
    return results;
  };

  // Generate steps based on selected bonuses
  const generateSteps = () => {
    const hasDB = selectedBonusData.db !== null;
    const hasWB = selectedBonusData.wb !== null;

    if (!hasDB && !hasWB) {
      return [{
        title: "No Bonus Selected",
        description: "Please select a bonus to continue",
        content: "Please select at least one bonus (DB or WB) from the search results to generate the appropriate message."
      }];
    }

    // Case 1: Only DB
    if (hasDB && !hasWB) {
      const db = selectedBonusData.db;
      const hasLimit = db.importantNote && db.importantNote.toLowerCase().includes('limit');

      return [{
        title: "Deposit Bonus Only",
        description: "Initial message for deposit bonus",
        content: `From what we can see, you should be eligible for the deposit bonus set at ${db.percentage || '[percentage]'} of deposited amount you deposited to your Stake account. In order to become eligible for your deposit bonus, you will need to deposit minimum ${db.minDeposit || '[min deposit]'} and a maximum of ${db.maxDeposit || '[max deposit]'}.

Please also note that you would not be able to withdraw any funds until you wager a full amount (deposit + bonus) ${db.wager || '[wager]'} times.

To see games you will not be able to play, check:
https://stake.com/policies/wager-requirements

When you complete the deposit, reach back out to us, and we will check with our Team in charge if you're eligible for the deposit bonus in question, and reach out to you as soon as possible.
${hasLimit ? '\nAlso, please note that your maximum bet will be limited to 10% of your deposit.' : ''}
If you require any other assistance, please make sure to reach out to us!`
      }];
    }

    // Case 2: Only WB
    if (!hasDB && hasWB) {
      const wb = selectedBonusData.wb;

      return [{
        title: "Welcome Bonus Only",
        description: "Initial message for welcome bonus",
        content: `Thank you for your patience.

After checking your account, you should be eligible for the deposit reload bonus of ${wb.offer || '[offer]'}. You will need to deposit a minimum of ${wb.depositRequirements || '[deposit requirement]'} and wager at least ${wb.minimumWager || '[minimum wager]'} for the bonus to be activated.

Once you've fulfilled the requirements, please reach out to us so we can check your eligibility with the team in charge.

If you have any further questions, don't hesitate to let me know.`
      }];
    }

    // Case 3: Both DB and WB
    if (hasDB && hasWB) {
      const db = selectedBonusData.db;
      const wb = selectedBonusData.wb;
      const hasLimit = db.importantNote && db.importantNote.toLowerCase().includes('limit');

      return [{
        title: "Deposit & Welcome Bonus",
        description: "Initial message for both bonuses",
        content: `Thank you for your patience.

There is a deposit bonus option associated with your affiliate.

You would have to meet a set of requirements. In the first place, you would have to make a deposit between ${db.minDeposit || '[min deposit]'} and ${db.maxDeposit || '[max deposit]'}, after which we would reach to our relevant team for further checking if you are eligible for this bonus. If they confirm, you would be able to receive a ${db.percentage || '[percentage]'} deposit bonus.

After that, you would have to complete the wager requirement, which means that you would have to wager ${db.wager || '[wager]'}x the combined amount of the first deposit and the bonus you have received.

While having a wager requirement active, your chosen currency will be locked until you meet the wager requirement set in the specific currency.
${hasLimit ? '\nAlso, please note that your maximum bet will be limited to 10% of your deposit.' : ''}
Here is the article for a reference:

[What is a Deposit Bonus Requirement]

You could reach out to us for further assistance after you make a deposit. Be sure not to wager those funds until you receive the update from our team in charge. Also, you have a welcome bonus offer available in the form of a reload (${wb.offer || '[offer]'}). If you would like to claim this, we would need to check your eligibility with our team in charge.

Please note that you may choose only one of these two bonuses.

If you have any other questions in the meantime, feel free to ask.`
      }];
    }

    return [];
  };

  const steps = generateSteps();

  // Update selected bonus data when selections change
  useEffect(() => {
    if (selectedDB) {
      const dbResult = results.find((r, idx) => `db-${r.affiliateName}-${idx}` === selectedDB);
      setSelectedBonusData(prev => ({ ...prev, db: dbResult }));
    } else {
      setSelectedBonusData(prev => ({ ...prev, db: null }));
    }
  }, [selectedDB, results]);

  useEffect(() => {
    if (selectedWB) {
      const wbResult = results.find((r, idx) => `wb-${r.affiliateName}-${idx}` === selectedWB);
      setSelectedBonusData(prev => ({ ...prev, wb: wbResult }));
    } else {
      setSelectedBonusData(prev => ({ ...prev, wb: null }));
    }
  }, [selectedWB, results]);

  const handleCopyContent = () => {
    const content = steps[currentStep].content;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderRichText = (text) => {
    // Simple rich text rendering for **bold** and *italic*
    let rendered = text;

    // Bold
    rendered = rendered.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    rendered = rendered.replace(/\*(.+?)\*/g, '<em>$1</em>');

    return <div dangerouslySetInnerHTML={{ __html: rendered.replace(/\n/g, '<br />') }} />;
  };

  const renderDBResult = (result, index) => {
    const cardId = `db-${result.affiliateName}-${index}`;
    const isExpanded = expandedCards[cardId];
    const isSelected = selectedDB === cardId;

    return (
      <div key={cardId} className={`border rounded-md overflow-hidden bg-white dark:bg-black transition-all ${
        isSelected
          ? 'border-gray-900 dark:border-neutral-50 shadow-md'
          : 'border-gray-200 dark:border-neutral-800'
      }`}>
        {/* Card Header - Always Visible */}
        <div className="flex items-center">
          {/* Selection Checkbox */}
          <div className="p-3 border-r border-gray-200 dark:border-neutral-800">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectCard(cardId, 'DB')}
              className="w-4 h-4 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Card Content */}
          <div
            className="flex-1 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
            onClick={() => toggleCard(cardId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Gift className="text-gray-600 dark:text-neutral-400" size={16} />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-50">
                    Deposit Bonus (DB)
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-neutral-400">
                    {result.affiliateName} • {result.bonusStatus || 'N/A'}
                    {result.bonus && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-xs">
                        Campaign: {result.bonus}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="text-gray-500 dark:text-neutral-400" size={16} />
              ) : (
                <ChevronDown className="text-gray-500 dark:text-neutral-400" size={16} />
              )}
            </div>
          </div>
        </div>

        {/* Card Body - Expandable */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-gray-200 dark:border-neutral-800 pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Bonus Status</p>
                <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.bonusStatus || 'N/A'}</p>
              </div>

              <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Affiliate Name</p>
                <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.affiliateName}</p>
              </div>

              {result.bonus && (
                <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                  <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Bonus</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{result.bonus}</p>
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
        )}
      </div>
    );
  };

  const renderWBResult = (result, index) => {
    const cardId = `wb-${result.affiliateName}-${index}`;
    const isExpanded = expandedCards[cardId];
    const isSelected = selectedWB === cardId;

    return (
      <div key={cardId} className={`border rounded-md overflow-hidden bg-white dark:bg-black transition-all ${
        isSelected
          ? 'border-gray-900 dark:border-neutral-50 shadow-md'
          : 'border-gray-200 dark:border-neutral-800'
      }`}>
        {/* Card Header - Always Visible */}
        <div className="flex items-center">
          {/* Selection Checkbox */}
          <div className="p-3 border-r border-gray-200 dark:border-neutral-800">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectCard(cardId, 'WB')}
              className="w-4 h-4 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Card Content */}
          <div
            className="flex-1 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
            onClick={() => toggleCard(cardId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Gift className="text-gray-600 dark:text-neutral-400" size={16} />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-50">
                    Welcome Bonus (WB)
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-neutral-400">
                    {result.affiliateName} • {result.bonusStatus || 'N/A'}
                    {result.campaignSpecific && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-xs">
                        Campaign: {result.campaignSpecific}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="text-gray-500 dark:text-neutral-400" size={16} />
              ) : (
                <ChevronDown className="text-gray-500 dark:text-neutral-400" size={16} />
              )}
            </div>
          </div>
        </div>

        {/* Card Body - Expandable */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-gray-200 dark:border-neutral-800 pt-3">
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
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section - Centered and Compact */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-50 mb-1">
            Affiliate Bonus Finder
          </h1>
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            Search for affiliate bonuses from the Stake.com database
          </p>
        </div>

        {/* Search Section - Centered and Compact */}
        <div className="max-w-4xl mx-auto mb-6">
          {error && (
            <div className="px-4 py-2 rounded mb-4 text-sm flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="px-4 py-2 rounded mb-4 text-sm flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-3">
            {/* Affiliate Name Input */}
            <div>
              <input
                id="affiliateName"
                name="affiliateName"
                type="text"
                required
                className="block w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                value={affiliateName}
                onChange={(e) => setAffiliateName(e.target.value)}
                placeholder="Enter affiliate name"
              />
            </div>

            {/* Campaign ID Input and Buttons in Same Row */}
            <div className="flex gap-3">
              <input
                id="campaignId"
                name="campaignId"
                type="text"
                className="w-1/2 px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="Campaign ID (optional)"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-1/4 px-3 py-2 bg-gray-900 dark:bg-neutral-50 text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-neutral-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <Search size={16} />
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-1/4 px-3 py-2 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-50 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 font-medium transition-colors text-sm"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Content Grid - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Search Results */}
          <div>
            <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-neutral-50">
                  Search Results
                </h2>

                {results.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        filter === 'all'
                          ? 'bg-gray-900 dark:bg-neutral-50 text-white dark:text-black'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 hover:bg-gray-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilter('db')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        filter === 'db'
                          ? 'bg-gray-900 dark:bg-neutral-50 text-white dark:text-black'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 hover:bg-gray-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      DB
                    </button>
                    <button
                      onClick={() => setFilter('wb')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        filter === 'wb'
                          ? 'bg-gray-900 dark:bg-neutral-50 text-white dark:text-black'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-neutral-50 hover:bg-gray-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      WB
                    </button>
                  </div>
                )}
              </div>

              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600 dark:text-neutral-400">
                  <Gift size={48} className="mb-3 opacity-50" />
                  <p className="text-sm">Enter an affiliate name to search for bonuses</p>
                </div>
              ) : (
                <div className="overflow-y-auto space-y-3 pr-2" style={{ maxHeight: 'calc(100vh - 360px)' }}>
                  {getFilteredResults().map((result, index) =>
                    result.source === 'DB' ? renderDBResult(result, index) : renderWBResult(result, index)
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Step by Step */}
          <div>
            <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                {/* Previous Step Button */}
                <button
                  onClick={goToPrevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                    currentStep === 0
                      ? 'text-gray-400 dark:text-neutral-600 cursor-not-allowed'
                      : 'text-gray-900 dark:text-neutral-50 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                  title={currentStep > 0 ? steps[currentStep - 1].title : ''}
                >
                  <ChevronLeft size={16} />
                  {currentStep > 0 && (
                    <span className="hidden sm:inline truncate max-w-[80px]">
                      {steps[currentStep - 1].title}
                    </span>
                  )}
                </button>

                {/* Current Step Title */}
                <div className="flex-1 text-center px-2">
                  <h2 className="text-base font-bold text-gray-900 dark:text-neutral-50">
                    Step {currentStep + 1} - {steps[currentStep].title}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-neutral-400 mt-1">
                    {steps[currentStep].description}
                  </p>
                </div>

                {/* Next Step Button */}
                <button
                  onClick={goToNextStep}
                  disabled={currentStep === steps.length - 1}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                    currentStep === steps.length - 1
                      ? 'text-gray-400 dark:text-neutral-600 cursor-not-allowed'
                      : 'text-gray-900 dark:text-neutral-50 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                  title={currentStep < steps.length - 1 ? steps[currentStep + 1].title : ''}
                >
                  {currentStep < steps.length - 1 && (
                    <span className="hidden sm:inline truncate max-w-[80px]">
                      {steps[currentStep + 1].title}
                    </span>
                  )}
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Rich Text Content Box */}
              <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 360px)' }}>
                <div className="border border-gray-200 dark:border-neutral-800 rounded-md p-4 bg-gray-50 dark:bg-neutral-900 font-mono text-xs text-gray-900 dark:text-neutral-50 whitespace-pre-wrap">
                  {renderRichText(steps[currentStep].content)}
                </div>

                {/* Copy Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleCopyContent}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-neutral-50 text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors text-sm"
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Content
                      </>
                    )}
                  </button>
                </div>

                {/* Selected Bonuses Info */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Selected Bonuses:
                  </h4>
                  <div className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                    {selectedBonusData.db ? (
                      <div>✓ DB: {selectedBonusData.db.affiliateName} - {selectedBonusData.db.bonusStatus}</div>
                    ) : (
                      <div className="text-blue-600 dark:text-blue-500">○ No DB bonus selected</div>
                    )}
                    {selectedBonusData.wb ? (
                      <div>✓ WB: {selectedBonusData.wb.affiliateName} - {selectedBonusData.wb.bonusStatus}</div>
                    ) : (
                      <div className="text-blue-600 dark:text-blue-500">○ No WB bonus selected</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateBonusFinder;
