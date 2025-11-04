import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Search, Network, FileText, Calendar, DollarSign, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

const HashExplorerFinder = () => {
  const [hash, setHash] = useState('');
  const [result, setResult] = useState({ message: '', type: '' });
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showContractTooltip, setShowContractTooltip] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hash.trim()) {
      setResult({ message: 'Please enter a transaction hash', type: 'error' });
      return;
    }

    const trimmedHash = hash.trim();
    setLoading(true);
    setResult({ message: 'Searching for transaction...', type: 'info' });
    setTransactionData(null);

    try {
      // Call backend API
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/transaction/lookup`,
        { hash: trimmedHash }
      );

      if (response.data.success) {
        setTransactionData(response.data.data);
        setResult({ message: 'Transaction found!', type: 'success' });
      }
    } catch (error) {
      console.error('Transaction lookup error:', error);
      setResult({
        message: error.response?.data?.message || 'Failed to find transaction',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Supported networks list
  const supportedNetworks = [
    { name: 'Bitcoin', coins: ['BTC'] },
    { name: 'Ethereum', coins: ['ETH', 'USDT', 'USDC', 'DAI', 'LINK', 'UNI', 'SHIB', 'APE', '...'] },
    { name: 'BSC', coins: ['BNB', 'USDT', 'USDC', 'DAI', 'LINK', '...'] },
    { name: 'Polygon', coins: ['MATIC', 'USDT', 'USDC', 'DAI', '...'] },
    { name: 'Solana', coins: ['SOL', 'TRUMP'] },
    { name: 'Tron', coins: ['TRX', 'USDT'] },
    { name: 'XRP', coins: ['XRP'] },
    { name: 'Litecoin', coins: ['LTC'] },
    { name: 'Dogecoin', coins: ['DOGE'] },
    { name: 'Bitcoin Cash', coins: ['BCH'] },
    { name: 'EOS', coins: ['EOS'] }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Search className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Hash Explorer Finder</h1>
            <p className="text-xs text-muted-foreground">Search transaction details across 50+ blockchain networks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-160px)]">
          {/* Left Panel - Input Form */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Search Transaction
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Enter any blockchain transaction hash
                  </p>
                </div>

                {result.message && (
                  <div className={`px-3 py-2 rounded-lg text-xs ${
                    result.type === 'error' ? 'bg-destructive/10 border border-destructive/20 text-destructive' : ''
                  }${
                    result.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : ''
                  }${
                    result.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : ''
                  }`}>
                    {result.message}
                  </div>
                )}

                <form className="space-y-3" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="hash" className="text-xs font-medium text-foreground">
                      Transaction Hash
                    </Label>
                    <input
                      id="hash"
                      name="hash"
                      type="text"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={hash}
                      onChange={(e) => setHash(e.target.value)}
                      placeholder="0x1234... or any transaction hash"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find Transaction
                      </>
                    )}
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* Supported Networks */}
            <Card className="flex-1 overflow-hidden">
              <CardContent className="p-4 h-full flex flex-col">
                <div className="space-y-1 mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Network className="w-4 h-4 text-primary" />
                    Supported Networks
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    50+ coins across major blockchains
                  </p>
                </div>
                <div className="space-y-2 overflow-y-auto pr-2 flex-1">
                  {supportedNetworks.map((network) => (
                    <div
                      key={network.name}
                      className="p-2.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{network.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {network.coins.length} coins
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {network.coins.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Transaction Details */}
          <div className="lg:col-span-2 overflow-y-auto">
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="space-y-1 mb-4">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Transaction Details
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Complete transaction information
                  </p>
                </div>

                {!transactionData ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-14 h-14 bg-muted/20 rounded-full flex items-center justify-center mb-3">
                      <Search className="w-7 h-7 text-muted-foreground/70" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">No Transaction Found</h3>
                    <p className="text-xs text-muted-foreground text-center max-w-md">
                      Enter a transaction hash to search across 50+ blockchain networks and view complete details
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Transaction Hash */}
                    <Card className="border-2">
                      <CardContent className="p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Transaction Hash</p>
                        <p className="text-xs font-mono text-foreground break-all leading-relaxed">{transactionData.hash}</p>
                      </CardContent>
                    </Card>

                    {/* Network & Coin */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <Network className="w-4 h-4 text-primary mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Network</p>
                              <Badge variant="outline" className="text-xs">
                                {transactionData.network} {transactionData.networkType && `(${transactionData.networkType})`}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <DollarSign className="w-4 h-4 text-primary mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Coin/Token</p>
                              <div className="relative inline-block">
                                <span
                                  className="text-sm font-semibold text-foreground cursor-pointer"
                                  onMouseEnter={() => transactionData.contractAddress && setShowContractTooltip(true)}
                                  onMouseLeave={() => setShowContractTooltip(false)}
                                >
                                  {transactionData.coin}
                                  {transactionData.contractAddress && (
                                    <span className="ml-1 text-xs text-muted-foreground">ⓘ</span>
                                  )}
                                </span>
                                {transactionData.contractAddress && showContractTooltip && (
                                  <div className="absolute z-10 bottom-full left-0 mb-2 p-2 bg-popover border border-border text-popover-foreground text-xs rounded-md shadow-lg w-64 break-all">
                                    <p className="font-semibold mb-1">Contract Address:</p>
                                    <p className="font-mono">{transactionData.contractAddress}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* From & To Addresses */}
                    <Card className="border-2">
                      <CardContent className="p-3 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-xs font-medium text-muted-foreground">From Address</p>
                          </div>
                          <p className="text-xs font-mono text-foreground break-all bg-muted/50 p-2 rounded">{transactionData.from}</p>
                        </div>

                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-xs font-medium text-muted-foreground">To Address</p>
                          </div>
                          <p className="text-xs font-mono text-foreground break-all bg-muted/50 p-2 rounded">{transactionData.to}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Amount, Date & Fee */}
                    <div className="grid grid-cols-3 gap-3">
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Amount</p>
                          <p className="text-sm font-bold text-foreground">
                            {transactionData.amount} {transactionData.coin}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Date & Time</p>
                              <p className="text-xs text-foreground">
                                {new Date(transactionData.dateTime).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Transaction Fee</p>
                          <p className="text-sm font-semibold text-foreground">{transactionData.fee}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* XRP Destination Tag */}
                    {transactionData.destinationTag !== undefined && (
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Destination Tag (XRP)</p>
                          <p className="text-sm text-foreground">
                            {transactionData.destinationTag || <span className="text-destructive font-semibold">Not Provided</span>}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* EOS Memo */}
                    {transactionData.memo !== undefined && (
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Memo (EOS)</p>
                          <p className="text-sm text-foreground">
                            {transactionData.memo || <span className="text-destructive font-semibold">Not Provided</span>}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Error Display */}
                    {transactionData.error && (
                      <Card className="border-2 border-destructive/20 bg-destructive/5">
                        <CardContent className="p-3">
                          <p className="text-sm font-semibold text-destructive">⚠️ {transactionData.error}</p>
                          {transactionData.errorDetails && (
                            <p className="text-xs text-destructive/80 mt-1">{transactionData.errorDetails}</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Status */}
                    {transactionData.status && (
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
                          <Badge
                            variant="outline"
                            className={`${
                              transactionData.status === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                            } flex items-center gap-1.5 w-fit px-3 py-1`}
                          >
                            {transactionData.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span className="capitalize font-medium">{transactionData.status}</span>
                          </Badge>
                        </CardContent>
                      </Card>
                    )}
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

export default HashExplorerFinder;
