import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import logoBlack from '../assets/images/LOGO-MAIN-BLACK.png';
import logoWhite from '../assets/images/LOGO-MAIN-WHITE.png';

const VIPProgressCalculator = () => {
  const { theme } = useTheme();
  const [percentage, setPercentage] = useState('');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // VIP Levels with their wager requirements
  const vipLevels = [
    { name: 'None', wager: 0 },
    { name: 'Bronze', wager: 10000 },
    { name: 'Silver', wager: 50000 },
    { name: 'Gold', wager: 100000 },
    { name: 'Platinum I', wager: 250000 },
    { name: 'Platinum II', wager: 500000 },
    { name: 'Platinum III', wager: 1000000 },
    { name: 'Platinum IV', wager: 2500000 },
    { name: 'Platinum V', wager: 5000000 },
    { name: 'Platinum VI', wager: 10000000 },
    { name: 'Diamond I', wager: 25000000 },
    { name: 'Diamond II', wager: 50000000 },
    { name: 'Diamond III', wager: 100000000 },
    { name: 'Diamond IV', wager: 250000000 },
    { name: 'Diamond V', wager: 500000000 },
    { name: 'Obsidian', wager: 1000000000 },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

  const handleCalculate = (e) => {
    e.preventDefault();

    const percentValue = parseFloat(percentage);

    if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
      setResult({ error: 'Please enter a valid percentage between 0 and 100' });
      return;
    }

    const currentLevel = vipLevels[currentLevelIndex];
    const nextLevel = vipLevels[currentLevelIndex + 1];

    if (!nextLevel) {
      setResult({ error: 'You are already at the maximum VIP level (Obsidian)!' });
      return;
    }

    // Calculate based on progress from current level to next level
    const totalRequired = nextLevel.wager;
    const levelRange = nextLevel.wager - currentLevel.wager;
    const progressInRange = (percentValue / 100) * levelRange;
    const currentWagered = currentLevel.wager + progressInRange;
    const remaining = totalRequired - currentWagered;

    setResult({
      percentage: percentValue,
      currentLevel: currentLevel.name,
      nextLevel: nextLevel.name,
      totalRequired,
      remaining: Math.round(remaining),
      currentWagered: Math.round(currentWagered),
    });
  };

  const handleCopyMacro = () => {
    if (!result || result.error) return;

    const macro = `Thank you for your patience.\n\nFrom what I can see, you're currently ${result.percentage}% of the way toward your <em>${result.nextLevel}</em> VIP level.To move from <em>${result.currentLevel}</em> to <em>${result.nextLevel}</em>, you'll need to wager a total of ${formatCurrency(result.totalRequired)}, meaning there's ${formatCurrency(result.remaining)} left to go.\n\nSports bets count three times more toward your wagering requirements. For example, to work out how many sports bets would get you to the next level, just divide the remaining amount by 3.If you're placing a mix of sports and casino bets, the best way to keep track of your progress is through your transaction history.\n\nWe've also prepared a quick guide so you can calculate it yourself anytime:\n[ADD_ARTICLE]\nIf you have any questions or just want an update along the way, we're here for you 24/7. Keep up the great progress!`;

    navigator.clipboard.writeText(macro);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <div className="p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-lg h-[calc(100vh-160px)] flex flex-col">
            <div className="mb-8">
              <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-neutral-50">
                VIP Progress Calculator
              </h2>
              <p className="mt-4 text-center text-sm text-gray-600 dark:text-neutral-400">
                Enter your VIP progress percentage to calculate how much you need to reach the next level
              </p>
            </div>

            {result?.error && (
              <div className="px-4 py-3 rounded mb-6 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                {result.error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleCalculate}>
              <div>
                <label htmlFor="currentLevel" className="block text-sm font-medium text-gray-900 dark:text-neutral-50">
                  Current VIP Level
                </label>
                <select
                  id="currentLevel"
                  name="currentLevel"
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  value={currentLevelIndex}
                  onChange={(e) => setCurrentLevelIndex(parseInt(e.target.value))}
                >
                  {vipLevels.slice(0, -1).map((level, index) => (
                    <option key={index} value={index}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="percentage" className="block text-sm font-medium text-gray-900 dark:text-neutral-50">
                  VIP Progress Percentage
                </label>
                <input
                  id="percentage"
                  name="percentage"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-black text-gray-900 dark:text-neutral-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="e.g., 45.67"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 dark:bg-neutral-50 dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Calculate
                </button>
              </div>
            </form>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-800">
                <h3 className="text-sm font-medium text-gray-900 dark:text-neutral-50 mb-3">
                  VIP Levels
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {vipLevels.slice(1).map((level) => (
                    <div
                      key={level.name}
                      className="flex justify-between items-center px-3 py-2 bg-gray-50 dark:bg-neutral-900 rounded text-xs"
                    >
                      <span className="text-gray-900 dark:text-neutral-50 font-medium">{level.name}</span>
                      <span className="text-gray-600 dark:text-neutral-400">{formatCurrency(level.wager)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Results & Macro */}
          <div className="flex-1">
            <div className="p-8 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-neutral-800 shadow-lg h-[calc(100vh-160px)] flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-50 mb-6">
                Calculation Results
              </h2>

              {!result || result.error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-600 dark:text-neutral-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Enter your VIP percentage to see the calculation</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center">
                  {/* Results Summary */}
                  <div className="space-y-4">
                    {/* First Row - Current and Next Level */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                        <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Current Level</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-neutral-50 italic">{result.currentLevel}</p>
                      </div>

                      <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                        <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Next Level</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-neutral-50 italic">{result.nextLevel}</p>
                      </div>
                    </div>

                    {/* Second Row - Progress, Total Required, Amount Remaining */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                        <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Progress</p>
                        <p className="text-sm text-gray-900 dark:text-neutral-50">{result.percentage}%</p>
                      </div>

                      <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                        <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Total Required</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-neutral-50">{formatCurrency(result.totalRequired)}</p>
                      </div>

                      <div className="pb-3 border-b border-gray-200 dark:border-neutral-800">
                        <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Amount Remaining</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-neutral-50">{formatCurrency(result.remaining)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Macro Message */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-neutral-800">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-neutral-50">Support Macro</h3>
                      <button
                        onClick={handleCopyMacro}
                        className="px-3 py-1 text-xs font-medium rounded-md text-white bg-gray-900 dark:bg-neutral-50 dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200 transition-colors"
                      >
                        {copied ? 'Copied!' : 'Copy Macro'}
                      </button>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg text-xs text-gray-900 dark:text-neutral-50 leading-relaxed space-y-3 max-h-96 overflow-y-auto">
                      <p>Thank you for your patience.</p>
                      <p>From what I can see, you're currently {result.percentage}% of the way toward your <em>{result.nextLevel}</em> VIP level.To move from <em>{result.currentLevel}</em> to <em>{result.nextLevel}</em>, you'll need to wager a total of {formatCurrency(result.totalRequired)}, meaning there's {formatCurrency(result.remaining)} left to go.</p>
                      <p>Sports bets count three times more toward your wagering requirements. For example, to work out how many sports bets would get you to the next level, just divide the remaining amount by 3.If you're placing a mix of sports and casino bets, the best way to keep track of your progress is through your transaction history.</p>
                      <p>We've also prepared a quick guide so you can calculate it yourself anytime:</p>
                      <p>[ADD_ARTICLE]</p>
                      <p>If you have any questions or just want an update along the way, we're here for you 24/7. Keep up the great progress!</p>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                        Note: Sports bets count 3x more towards VIP progress than casino bets.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIPProgressCalculator;
