import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Calculator, TrendingUp, Copy, Check, DollarSign, Award } from 'lucide-react';

const VIPProgressCalculator = () => {
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">VIP Progress Calculator</h1>
            <p className="text-xs text-muted-foreground">Calculate how much you need to reach the next VIP level</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-160px)]">
          {/* Left Panel - Input Form */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Calculate Progress
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Enter your current level and progress percentage
                  </p>
                </div>

                {result?.error && (
                  <div className="px-3 py-2 rounded-lg text-xs bg-destructive/10 border border-destructive/20 text-destructive">
                    {result.error}
                  </div>
                )}

                <form className="space-y-3" onSubmit={handleCalculate}>
                  <div className="space-y-1.5">
                    <Label htmlFor="currentLevel" className="text-xs font-medium text-foreground">
                      Current VIP Level
                    </Label>
                    <select
                      id="currentLevel"
                      name="currentLevel"
                      className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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

                  <div className="space-y-1.5">
                    <Label htmlFor="percentage" className="text-xs font-medium text-foreground">
                      VIP Progress Percentage
                    </Label>
                    <input
                      id="percentage"
                      name="percentage"
                      type="text"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      placeholder="e.g., 45.67"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Progress
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* VIP Levels List */}
            <Card className="flex-1 overflow-hidden">
              <CardContent className="p-4 h-full flex flex-col">
                <div className="space-y-1 mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    VIP Levels
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    All available VIP tiers and requirements
                  </p>
                </div>
                <div className="space-y-1.5 overflow-y-auto pr-2 flex-1">
                  {vipLevels.slice(1).map((level) => (
                    <div
                      key={level.name}
                      className="flex items-center justify-between px-2.5 py-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                    >
                      <span className="text-xs font-medium text-foreground">{level.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {formatCurrency(level.wager)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 overflow-y-auto">
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="space-y-1 mb-4">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Calculation Results
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    View your progress details and remaining requirements
                  </p>
                </div>

                {!result || result.error ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-14 h-14 bg-muted/20 rounded-full flex items-center justify-center mb-3">
                      <Calculator className="w-7 h-7 text-muted-foreground/70" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">No Calculation Yet</h3>
                    <p className="text-xs text-muted-foreground text-center max-w-md">
                      Enter your current VIP level and progress percentage to see your detailed progress calculation
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Results Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card className="border-2">
                        <CardContent className="p-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground">Current Level</p>
                            <p className="text-xl font-bold text-foreground italic">{result.currentLevel}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-primary/20 bg-primary/5">
                        <CardContent className="p-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground">Next Level</p>
                            <p className="text-xl font-bold text-primary italic">{result.nextLevel}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card>
                        <CardContent className="p-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground">Progress</p>
                            <p className="text-lg font-semibold text-foreground">{result.percentage}%</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground">Total Required</p>
                            <p className="text-lg font-semibold text-foreground">{formatCurrency(result.totalRequired)}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-amber-500/20 bg-amber-500/5">
                        <CardContent className="p-3">
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground">Amount Remaining</p>
                            <p className="text-lg font-bold text-amber-600 dark:text-amber-500">{formatCurrency(result.remaining)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Support Macro Section */}
                    <Card className="border-2">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-foreground">Support Macro</h3>
                          <button
                            onClick={handleCopyMacro}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy Macro
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-xs text-foreground leading-relaxed space-y-2 max-h-64 overflow-y-auto">
                          <p>Thank you for your patience.</p>
                          <p>From what I can see, you're currently {result.percentage}% of the way toward your <em>{result.nextLevel}</em> VIP level.To move from <em>{result.currentLevel}</em> to <em>{result.nextLevel}</em>, you'll need to wager a total of {formatCurrency(result.totalRequired)}, meaning there's {formatCurrency(result.remaining)} left to go.</p>
                          <p>Sports bets count three times more toward your wagering requirements. For example, to work out how many sports bets would get you to the next level, just divide the remaining amount by 3.If you're placing a mix of sports and casino bets, the best way to keep track of your progress is through your transaction history.</p>
                          <p>We've also prepared a quick guide so you can calculate it yourself anytime:</p>
                          <p>[ADD_ARTICLE]</p>
                          <p>If you have any questions or just want an update along the way, we're here for you 24/7. Keep up the great progress!</p>
                        </div>
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                            Note: Sports bets count 3x more towards VIP progress than casino bets.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIPProgressCalculator;
