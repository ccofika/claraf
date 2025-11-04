import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Gift, AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Copy, Check, Filter, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';

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
      <Card key={cardId} className={`transition-all ${
        isSelected
          ? 'border-2 border-primary shadow-md'
          : 'border'
      }`}>
        {/* Card Header - Always Visible */}
        <div className="flex items-center">
          {/* Selection Checkbox */}
          <div className="p-2 border-r border-border">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectCard(cardId, 'DB')}
              className="w-3.5 h-3.5 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Card Content */}
          <div
            className="flex-1 p-2 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleCard(cardId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Gift className="text-primary" size={14} />
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-foreground">
                    Deposit Bonus (DB)
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <span>{result.affiliateName}</span>
                    <span>•</span>
                    <span>{result.bonusStatus || 'N/A'}</span>
                    {result.bonus && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        Campaign: {result.bonus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="text-muted-foreground" size={14} />
              ) : (
                <ChevronDown className="text-muted-foreground" size={14} />
              )}
            </div>
          </div>
        </div>

        {/* Card Body - Expandable */}
        {isExpanded && (
          <div className="px-2 pb-2 border-t border-border pt-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="pb-2 border-b border-border">
                <p className="text-muted-foreground mb-0.5">Bonus Status</p>
                <p className="font-medium text-foreground">{result.bonusStatus || 'N/A'}</p>
              </div>

              <div className="pb-2 border-b border-border">
                <p className="text-muted-foreground mb-0.5">Affiliate Name</p>
                <p className="font-medium text-foreground">{result.affiliateName}</p>
              </div>

              {result.bonus && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Bonus</p>
                  <p className="font-medium text-foreground">{result.bonus}</p>
                </div>
              )}

              {result.percentage && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Percentage</p>
                  <p className="font-medium text-foreground">{result.percentage}</p>
                </div>
              )}

              {result.wager && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Wager</p>
                  <p className="font-medium text-foreground">{result.wager}</p>
                </div>
              )}

              {result.minDeposit && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Min Deposit</p>
                  <p className="font-medium text-foreground">{result.minDeposit}</p>
                </div>
              )}

              {result.maxDeposit && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Max Deposit</p>
                  <p className="font-medium text-foreground">{result.maxDeposit}</p>
                </div>
              )}

              {result.managedBy && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Managed By</p>
                  <p className="font-medium text-foreground">{result.managedBy}</p>
                </div>
              )}

              {result.language && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Language</p>
                  <p className="font-medium text-foreground">{result.language}</p>
                </div>
              )}

              {result.kycRequirement && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">KYC Requirement</p>
                  <p className="font-medium text-foreground">{result.kycRequirement}</p>
                </div>
              )}

              {result.platformMethod && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Platform/Method</p>
                  <p className="font-medium text-foreground">{result.platformMethod}</p>
                </div>
              )}

              {result.contactInstructions && (
                <div className="col-span-2 pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Contact Instructions</p>
                  <p className="font-medium text-foreground whitespace-pre-wrap">{result.contactInstructions}</p>
                </div>
              )}

              {result.importantNote && (
                <div className="col-span-2 pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Important Note</p>
                  <p className="font-medium text-foreground whitespace-pre-wrap">{result.importantNote}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderWBResult = (result, index) => {
    const cardId = `wb-${result.affiliateName}-${index}`;
    const isExpanded = expandedCards[cardId];
    const isSelected = selectedWB === cardId;

    return (
      <Card key={cardId} className={`transition-all ${
        isSelected
          ? 'border-2 border-primary shadow-md'
          : 'border'
      }`}>
        {/* Card Header - Always Visible */}
        <div className="flex items-center">
          {/* Selection Checkbox */}
          <div className="p-2 border-r border-border">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectCard(cardId, 'WB')}
              className="w-3.5 h-3.5 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Card Content */}
          <div
            className="flex-1 p-2 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleCard(cardId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Sparkles className="text-primary" size={14} />
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-foreground">
                    Welcome Bonus (WB)
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <span>{result.affiliateName}</span>
                    <span>•</span>
                    <span>{result.bonusStatus || 'N/A'}</span>
                    {result.campaignSpecific && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        Campaign: {result.campaignSpecific}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="text-muted-foreground" size={14} />
              ) : (
                <ChevronDown className="text-muted-foreground" size={14} />
              )}
            </div>
          </div>
        </div>

        {/* Card Body - Expandable */}
        {isExpanded && (
          <div className="px-2 pb-2 border-t border-border pt-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="pb-2 border-b border-border">
                <p className="text-muted-foreground mb-0.5">Bonus Status</p>
                <p className="font-medium text-foreground">{result.bonusStatus || 'N/A'}</p>
              </div>

              <div className="pb-2 border-b border-border">
                <p className="text-muted-foreground mb-0.5">Affiliate Name</p>
                <p className="font-medium text-foreground">{result.affiliateName}</p>
              </div>

              {result.campaignSpecific && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Campaign-Specific</p>
                  <p className="font-medium text-foreground">{result.campaignSpecific}</p>
                </div>
              )}

              {result.offer && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Offer</p>
                  <p className="font-medium text-foreground">{result.offer}</p>
                </div>
              )}

              {result.amount && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Amount</p>
                  <p className="font-medium text-foreground">{result.amount}</p>
                </div>
              )}

              {result.currency && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Currency</p>
                  <p className="font-medium text-foreground">{result.currency}</p>
                </div>
              )}

              {result.days && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Days</p>
                  <p className="font-medium text-foreground">{result.days}</p>
                </div>
              )}

              {result.depositRequirements && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Deposit Requirements</p>
                  <p className="font-medium text-foreground">{result.depositRequirements}</p>
                </div>
              )}

              {result.minimumWager && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Minimum Wager</p>
                  <p className="font-medium text-foreground">{result.minimumWager}</p>
                </div>
              )}

              {result.wagerRequirement && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Wager Requirement</p>
                  <p className="font-medium text-foreground">{result.wagerRequirement}</p>
                </div>
              )}

              {result.managedBy && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Managed By</p>
                  <p className="font-medium text-foreground">{result.managedBy}</p>
                </div>
              )}

              {result.language && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Language</p>
                  <p className="font-medium text-foreground">{result.language}</p>
                </div>
              )}

              {result.kycRequirement && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">KYC Requirement</p>
                  <p className="font-medium text-foreground">{result.kycRequirement}</p>
                </div>
              )}

              {result.platformMethod && (
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Platform/Method</p>
                  <p className="font-medium text-foreground">{result.platformMethod}</p>
                </div>
              )}

              {result.contactInstructions && (
                <div className="col-span-2 pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Contact Instructions</p>
                  <p className="font-medium text-foreground whitespace-pre-wrap">{result.contactInstructions}</p>
                </div>
              )}

              {result.importantNotes && (
                <div className="col-span-2 pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-0.5">Important Notes</p>
                  <p className="font-medium text-foreground whitespace-pre-wrap">{result.importantNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Affiliate Bonus Finder</h1>
            <p className="text-xs text-muted-foreground">Search affiliate bonuses from Stake.com database</p>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardContent className="p-3">
            {error && (
              <div className="px-2 py-1.5 rounded-lg mb-2 text-xs flex items-start gap-1.5 bg-destructive/10 border border-destructive/20 text-destructive">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="px-2 py-1.5 rounded-lg mb-2 text-xs flex items-start gap-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            <form onSubmit={handleSearch} className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="affiliateName" className="text-xs font-medium text-foreground">
                  Affiliate Name
                </Label>
                <input
                  id="affiliateName"
                  name="affiliateName"
                  type="text"
                  required
                  className="flex h-8 w-full rounded-md border border-input bg-card text-foreground px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={affiliateName}
                  onChange={(e) => setAffiliateName(e.target.value)}
                  placeholder="Enter affiliate name"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="campaignId" className="text-xs font-medium text-foreground">
                    Campaign ID (Optional)
                  </Label>
                  <input
                    id="campaignId"
                    name="campaignId"
                    type="text"
                    className="flex h-8 w-full rounded-md border border-input bg-card text-foreground px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    placeholder="Campaign ID"
                  />
                </div>
                <div className="flex items-end gap-1.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-3 h-8 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-1.5"
                  >
                    <Search size={12} />
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 h-8 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Content Grid - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          {/* Left Column - Search Results */}
          <div className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <Card className="flex-1 overflow-hidden flex flex-col">
              <CardContent className="p-2 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-primary" />
                    <h2 className="text-xs font-semibold text-foreground">Search Results</h2>
                  </div>

                  {results.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Filter className="w-3 h-3 text-muted-foreground" />
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                          filter === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilter('db')}
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                          filter === 'db'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        DB
                      </button>
                      <button
                        onClick={() => setFilter('wb')}
                        className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                          filter === 'wb'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        WB
                      </button>
                    </div>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-6">
                    <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mb-2">
                      <Gift className="w-6 h-6 text-muted-foreground/70" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">No Results</h3>
                    <p className="text-xs text-muted-foreground text-center max-w-md">
                      Enter an affiliate name to search for bonuses
                    </p>
                  </div>
                ) : (
                  <div className="overflow-y-auto space-y-1.5 pr-1 pb-3 flex-1 min-h-0">
                    {getFilteredResults().map((result, index) =>
                      result.source === 'DB' ? renderDBResult(result, index) : renderWBResult(result, index)
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Step by Step */}
          <div className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <Card className="flex-1 overflow-hidden flex flex-col">
              <CardContent className="p-2 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  {/* Previous Step Button */}
                  <button
                    onClick={goToPrevStep}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded transition-colors ${
                      currentStep === 0
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'text-foreground hover:bg-muted'
                    }`}
                    title={currentStep > 0 ? steps[currentStep - 1].title : ''}
                  >
                    <ChevronLeft size={12} />
                    {currentStep > 0 && (
                      <span className="hidden sm:inline truncate max-w-[60px]">
                        {steps[currentStep - 1].title}
                      </span>
                    )}
                  </button>

                  {/* Current Step Title */}
                  <div className="flex-1 text-center px-1">
                    <div className="flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <h2 className="text-xs font-semibold text-foreground">
                        Step {currentStep + 1}
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {steps[currentStep].title}
                    </p>
                  </div>

                  {/* Next Step Button */}
                  <button
                    onClick={goToNextStep}
                    disabled={currentStep === steps.length - 1}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded transition-colors ${
                      currentStep === steps.length - 1
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'text-foreground hover:bg-muted'
                    }`}
                    title={currentStep < steps.length - 1 ? steps[currentStep + 1].title : ''}
                  >
                    {currentStep < steps.length - 1 && (
                      <span className="hidden sm:inline truncate max-w-[60px]">
                        {steps[currentStep + 1].title}
                      </span>
                    )}
                    <ChevronRight size={12} />
                  </button>
                </div>

                {/* Rich Text Content Box */}
                <div className="overflow-y-auto pr-1 pb-3 flex-1 min-h-0 space-y-2">
                  <div className="border border-border rounded-lg p-2 bg-muted/50 font-mono text-xs text-foreground whitespace-pre-wrap">
                    {renderRichText(steps[currentStep].content)}
                  </div>

                  {/* Copy Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleCopyContent}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-xs font-medium"
                    >
                      {copied ? (
                        <>
                          <Check size={12} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Selected Bonuses Info */}
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Selected Bonuses:
                    </h4>
                    <div className="text-xs text-blue-800 dark:text-blue-400 space-y-0.5">
                      {selectedBonusData.db ? (
                        <div>✓ DB: {selectedBonusData.db.affiliateName}</div>
                      ) : (
                        <div className="text-blue-600 dark:text-blue-500">○ No DB selected</div>
                      )}
                      {selectedBonusData.wb ? (
                        <div>✓ WB: {selectedBonusData.wb.affiliateName}</div>
                      ) : (
                        <div className="text-blue-600 dark:text-blue-500">○ No WB selected</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateBonusFinder;
