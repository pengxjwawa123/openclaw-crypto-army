import { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Play,
  Square,
  RotateCw,
  Trash2,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Send,
  DollarSign,
  Globe,
  ArrowDownToLine,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Save,
  MessageSquare,
} from 'lucide-react';
import { Bot, MasterWallet } from '../../types';
import { cn } from '../../lib/cn';
import { IconButton } from '../ui/IconButton';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { formatPercentage } from '../../lib/formatters';
import { api } from '../../api';
import { ChatInterface } from './ChatInterface';

interface ContainerDetailPanelProps {
  bot: Bot | null;
  onClose: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
}

interface ProcessingTask {
  id: string;
  title: string;
  status: 'completed' | 'processing' | 'pending' | 'error';
  progress?: number;
  timestamp: number;
}

// Mock processing tasks
const mockTasks: ProcessingTask[] = [
  { id: '1', title: 'Initialize container', status: 'completed', progress: 100, timestamp: Date.now() - 300000 },
  { id: '2', title: 'Load trading strategies', status: 'completed', progress: 100, timestamp: Date.now() - 240000 },
  { id: '3', title: 'Connect to blockchain', status: 'processing', progress: 65, timestamp: Date.now() - 120000 },
  { id: '4', title: 'Sync wallet balances', status: 'pending', timestamp: Date.now() },
  { id: '5', title: 'Start trading engine', status: 'pending', timestamp: Date.now() },
];

export function ContainerDetailPanel({
  bot,
  onClose,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewLogs,
}: ContainerDetailPanelProps) {
  const [tasks] = useState<ProcessingTask[]>(mockTasks);
  const [copied, setCopied] = useState(false);
  const [subdomainModalOpen, setSubdomainModalOpen] = useState(false);
  const [subdomainName, setSubdomainName] = useState('');
  const [sendEthModalOpen, setSendEthModalOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [masterWallet, setMasterWallet] = useState<MasterWallet | null>(null);
  const [loadingMasterWallet, setLoadingMasterWallet] = useState(false);
  const [containerBalance, setContainerBalance] = useState<string>('0.0000');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [ensSubdomain, setEnsSubdomain] = useState<any | null>(null);
  const [loadingENS, setLoadingENS] = useState(false);
  const [creatingSubdomain, setCreatingSubdomain] = useState(false);
  const [subdomainTxHash, setSubdomainTxHash] = useState<string | null>(null);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [envModalOpen, setEnvModalOpen] = useState(false);
  const [editedEnv, setEditedEnv] = useState<Record<string, string>>({});
  const [visibleEnvKeys, setVisibleEnvKeys] = useState<Set<string>>(new Set());
  const [recreating, setRecreating] = useState(false);
  const [envShowAll, setEnvShowAll] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [walletEnsName, setWalletEnsName] = useState<string | null>(null);
  const [loadingEns, setLoadingEns] = useState(false);

  // Fetch wallet ENS name
  const fetchWalletEnsName = async () => {
    if (!bot?.wallet?.address) return;

    try {
      setLoadingEns(true);
      const response = await fetch(`http://localhost:3000/api/ens/lookup/${bot.wallet.address}`);

      if (!response.ok) {
        throw new Error('Failed to fetch ENS name');
      }

      const data = await response.json();
      setWalletEnsName(data.ensName);
    } catch (error) {
      console.error('Failed to fetch wallet ENS name:', error);
      setWalletEnsName(null);
    } finally {
      setLoadingEns(false);
    }
  };

  // Fetch container balance
  const fetchContainerBalance = async () => {
    if (!bot?.id) return;

    try {
      setLoadingBalance(true);
      // Call backend API to fetch balance
      const response = await fetch(`http://localhost:3000/api/bots/${bot.id}/balance`);

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      setContainerBalance(data.formatted);
    } catch (error) {
      console.error('Failed to fetch container balance:', error);
      setContainerBalance('0.0000');
    } finally {
      setLoadingBalance(false);
    }
  };

  // Fetch transaction history
  const fetchTransactions = async () => {
    if (!bot?.id) return;

    try {
      setLoadingTransactions(true);
      const response = await fetch(`http://localhost:3000/api/transactions/bot/${bot.id}`);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fetch master wallet on mount
  useEffect(() => {
    const fetchMasterWallet = async () => {
      try {
        setLoadingMasterWallet(true);
        const data = await api.getMasterWallet();
        setMasterWallet(data);
      } catch (error) {
        console.error('Failed to fetch master wallet:', error);
      } finally {
        setLoadingMasterWallet(false);
      }
    };
    fetchMasterWallet();
  }, []);

  // Fetch container balance and ENS name when bot changes
  useEffect(() => {
    fetchContainerBalance();
    fetchWalletEnsName();
  }, [bot?.wallet?.address]);

  // Fetch transactions when bot changes
  useEffect(() => {
    fetchTransactions();
  }, [bot?.id]);

  // Fetch ENS subdomain when bot changes
  useEffect(() => {
    const fetchENSSubdomain = async () => {
      if (!bot?.id) return;

      try {
        setLoadingENS(true);
        const response = await fetch(`http://localhost:3000/api/ens/subdomain/${bot.id}`);
        if (response.ok) {
          const data = await response.json();
          setEnsSubdomain(data);
        } else {
          setEnsSubdomain(null);
        }
      } catch (error) {
        console.error('Failed to fetch ENS subdomain:', error);
        setEnsSubdomain(null);
      } finally {
        setLoadingENS(false);
      }
    };

    fetchENSSubdomain();
  }, [bot?.id]);

  // Calculate mock gas fee
  const mockGasFee = '0.0021';
  const totalAmount = sendAmount ? (parseFloat(sendAmount) + parseFloat(mockGasFee)).toFixed(4) : '0.0000';

  // Get master wallet total balance
  const masterWalletBalance = masterWallet?.balances
    ? Object.values(masterWallet.balances).reduce((sum, { formatted }) => {
        const value = parseFloat(formatted);
        return sum + (isNaN(value) ? 0 : value);
      }, 0)
    : 0;

  const handleCopyAddress = () => {
    if (bot?.wallet?.address) {
      navigator.clipboard.writeText(bot.wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateSubdomain = async () => {
    if (!bot?.id || !subdomainName) return;

    try {
      setCreatingSubdomain(true);
      setSubdomainError(null);
      setSubdomainTxHash(null);

      const response = await fetch('http://localhost:3000/api/ens/subdomain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: bot.id,
          subdomain: subdomainName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subdomain');
      }

      setSubdomainTxHash(data.transactionHash);

      // Refresh ENS subdomain data
      const subdomainResponse = await fetch(`http://localhost:3000/api/ens/subdomain/${bot.id}`);
      if (subdomainResponse.ok) {
        const subdomainData = await subdomainResponse.json();
        setEnsSubdomain(subdomainData);
      }

      // Don't close modal immediately - show success message
      setTimeout(() => {
        setSubdomainModalOpen(false);
        setSubdomainName('');
        setSubdomainTxHash(null);
      }, 3000);

    } catch (error: any) {
      console.error('Subdomain creation failed:', error);
      setSubdomainError(error.message || 'Failed to create subdomain');
    } finally {
      setCreatingSubdomain(false);
    }
  };

  const handleSendEth = () => {
    // Mock ETH send
    console.log('Sending ETH:', {
      from: bot?.wallet?.address,
      to: recipientAddress,
      amount: sendAmount,
      gasFee: mockGasFee,
      total: totalAmount,
    });
    setSendEthModalOpen(false);
    setSendAmount('');
    setRecipientAddress('');
  };

  // Open env modal and initialize edited env
  const handleOpenEnvModal = () => {
    if (bot?.env) {
      const filteredEnv = Object.entries(bot.env)
        .filter(([key]) => !['PRIVATE_KEY', 'WALLET_ADDRESS', 'BOT_ID', 'BOT_NAME'].includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      setEditedEnv(filteredEnv);
    }
    setEnvModalOpen(true);
  };

  const handleToggleEnvVisibility = (key: string) => {
    setVisibleEnvKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleAddEnvVar = () => {
    const newKey = `NEW_VAR_${Object.keys(editedEnv).length + 1}`;
    setEditedEnv({ ...editedEnv, [newKey]: '' });
  };

  const handleRemoveEnvVar = (key: string) => {
    const { [key]: _, ...rest } = editedEnv;
    setEditedEnv(rest);
  };

  const handleEnvKeyChange = (oldKey: string, newKey: string) => {
    const { [oldKey]: value, ...rest } = editedEnv;
    setEditedEnv({ ...rest, [newKey]: value });
  };

  const handleEnvValueChange = (key: string, value: string) => {
    setEditedEnv({ ...editedEnv, [key]: value });
  };

  const handleSaveEnv = async () => {
    if (!bot?.id) return;

    try {
      setRecreating(true);
      const response = await fetch(`http://localhost:3000/api/bots/${bot.id}/recreate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          env: editedEnv,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to recreate container');
      }

      // Close modal and refresh
      setEnvModalOpen(false);

      // Refresh bot data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to recreate container:', error);
      alert(`Failed to update environment: ${error.message}`);
    } finally {
      setRecreating(false);
    }
  };

  const handleFundFromMaster = async () => {
    if (!bot?.wallet?.address || !masterWallet?.address || !fundAmount) return;

    try {
      setSendingTransaction(true);
      setTransactionError(null);
      setTransactionHash(null);

      const response = await fetch('http://localhost:3000/api/transactions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: bot.wallet.address,
          amount: fundAmount,
          botId: bot.id,
          botName: bot.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send transaction');
      }

      setTransactionHash(data.hash);

      // Refresh container balance and transactions after a short delay
      setTimeout(() => {
        fetchContainerBalance();
        fetchTransactions();
      }, 2000);

    } catch (error: any) {
      console.error('Transaction failed:', error);
      setTransactionError(error.message || 'Failed to send transaction');
    } finally {
      setSendingTransaction(false);
    }
  };

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const canSend = sendAmount &&
                  parseFloat(sendAmount) > 0 &&
                  parseFloat(sendAmount) <= parseFloat(containerBalance) &&
                  recipientAddress &&
                  isValidAddress(recipientAddress);

  if (!bot) {
    return null;
  }

  const getTaskIcon = (status: ProcessingTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-success" />;
      case 'processing':
        return <Loader2 size={16} className="text-primary animate-spin" />;
      case 'error':
        return <AlertCircle size={16} className="text-danger" />;
      default:
        return <Clock size={16} className="text-text-muted" />;
    }
  };

  return (
    <div className="w-80 h-full bg-bg-elevated border-l border-bg-surface flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-bg-surface flex items-center justify-between flex-shrink-0">
        <h3 className="font-bold text-lg text-text-primary font-display">
          {showChat ? 'Chat' : 'Container Details'}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Wallet Address */}
        <div className="p-4 border-b border-bg-surface">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="text-primary" size={16} />
            <span className="text-xs font-accent text-text-secondary uppercase tracking-wider">
              Wallet
            </span>
          </div>

          {/* ENS Name (if available) */}
          {ensSubdomain && (
            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                <Globe className="text-primary flex-shrink-0" size={14} />
                <span className="text-sm font-semibold text-primary flex-1 truncate">
                  {ensSubdomain.fullDomain}
                </span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-accent uppercase flex items-center gap-1',
                    ensSubdomain.status === 'confirmed' && 'bg-success/20 text-success',
                    ensSubdomain.status === 'pending' && 'bg-warning/20 text-warning',
                    ensSubdomain.status === 'failed' && 'bg-danger/20 text-danger'
                  )}
                >
                  {ensSubdomain.status === 'pending' && <Loader2 size={10} className="animate-spin" />}
                  {ensSubdomain.status === 'confirmed' && <CheckCircle2 size={10} />}
                  {ensSubdomain.status === 'failed' && <AlertCircle size={10} />}
                  {ensSubdomain.status}
                </span>
              </div>

              {/* Transaction Hash */}
              {ensSubdomain.transactionHash && (
                <div className="p-2 bg-bg-surface/30 rounded border border-bg-surface">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-text-muted">Transaction</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${ensSubdomain.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-light flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs">View</span>
                      <Globe size={10} />
                    </a>
                  </div>
                  <code className="font-mono text-xs text-text-secondary block truncate">
                    {ensSubdomain.transactionHash}
                  </code>
                </div>
              )}

              {/* Created timestamp */}
              {ensSubdomain.timestamp && (
                <div className="text-xs text-text-muted">
                  Created: {new Date(ensSubdomain.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Address with Copy Button */}
          {console.log(walletEnsName)}
          <div className="flex items-center gap-2 p-2 bg-bg-surface/50 rounded-lg border border-bg-surface mb-3">
            <div className="flex-1">
              {/* ENS Name (if available) */}
              {loadingEns ? (
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Looking up ENS...</span>
                </div>
              ) : walletEnsName ? (
                <div className="text-sm font-medium text-primary mb-1 flex items-center gap-1">
                  {walletEnsName}
                  <CheckCircle2 size={14} className="text-success" />
                </div>
              ) : null}
              {/* Wallet Address */}
              <div className="font-mono text-xs text-text-primary break-all">
                {bot.wallet?.address || 'N/A'}
              </div>
            </div>
            <IconButton
              onClick={handleCopyAddress}
              variant="ghost"
              size="sm"
              aria-label="Copy address"
              className="flex-shrink-0"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </IconButton>
          </div>

          {/* Balance Display */}
          <div className="flex items-center justify-between p-3 bg-bg-surface/30 rounded-lg border border-bg-surface mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="text-primary" size={14} />
              <span className="text-xs text-text-secondary">Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="font-mono text-sm font-semibold text-text-primary">
                  {loadingBalance ? '...' : containerBalance}
                </span>
                <span className="text-xs text-text-muted">ETH</span>
              </div>
              <IconButton
                onClick={fetchContainerBalance}
                variant="ghost"
                size="sm"
                aria-label="Refresh balance"
                className={cn('flex-shrink-0', loadingBalance && 'animate-spin')}
              >
                <RefreshCw size={12} />
              </IconButton>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 mb-3">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              leftIcon={<ArrowDownToLine size={14} />}
              className="text-xs shadow-glow-sm hover:shadow-glow-md"
              onClick={() => setFundModalOpen(true)}
            >
              Fund from Master
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Send size={14} />}
                className="text-xs"
                onClick={() => setSendEthModalOpen(true)}
              >
                Send ETH
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Globe size={14} />}
                className="text-xs"
                onClick={() => setSubdomainModalOpen(true)}
              >
                Subdomain
              </Button>
            </div>
          </div>

          {/* Derivation Path */}
          {bot.wallet?.derivationPath && (
            <div className="text-xs text-text-muted">
              <span className="font-accent">Path:</span> {bot.wallet.derivationPath}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="p-4 border-b border-bg-surface">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="text-primary" size={16} />
              <span className="text-xs font-accent text-text-secondary uppercase tracking-wider">
                Recent Transactions
              </span>
            </div>
            {transactions.length > 0 && (
              <span className="text-xs text-text-muted">{transactions.length}</span>
            )}
            {loadingTransactions && (
              <Loader2 size={12} className="text-primary animate-spin" />
            )}
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="p-2 bg-bg-surface/30 rounded border border-bg-surface hover:border-bg-hover transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {tx.status === 'confirmed' && (
                        <CheckCircle2 size={12} className="text-success flex-shrink-0" />
                      )}
                      {tx.status === 'pending' && (
                        <Loader2 size={12} className="text-warning animate-spin flex-shrink-0" />
                      )}
                      {tx.status === 'failed' && (
                        <AlertCircle size={12} className="text-danger flex-shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-text-primary">
                        +{tx.amount} ETH
                      </span>
                    </div>
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded uppercase font-accent',
                        tx.status === 'confirmed' && 'bg-success/20 text-success',
                        tx.status === 'pending' && 'bg-warning/20 text-warning',
                        tx.status === 'failed' && 'bg-danger/20 text-danger'
                      )}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs text-text-muted truncate flex-1">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    </code>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-light flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe size={10} />
                    </a>
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-bg-surface/30 rounded-lg border border-bg-surface text-center">
              <FileText size={24} className="text-text-muted mx-auto mb-2" />
              <p className="text-xs text-text-muted">No transactions yet</p>
              <p className="text-xs text-text-muted mt-1">
                Fund this container to see transaction history
              </p>
            </div>
          )}
        </div>

        {/* Environment Variables */}
        <div className="p-4 border-b border-bg-surface">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings className="text-primary" size={16} />
              <span className="text-xs font-accent text-text-secondary uppercase tracking-wider">
                Environment Variables
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenEnvModal}
              className="h-6 px-2 text-xs"
            >
              <Settings size={12} className="mr-1" />
              Edit
            </Button>
          </div>

          {bot.env && Object.keys(bot.env).length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(bot.env)
                .filter(([key]) => !['PRIVATE_KEY', 'WALLET_ADDRESS', 'BOT_ID', 'BOT_NAME'].includes(key))
                .slice(0, envShowAll ? undefined : 5)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="p-2 bg-bg-surface/30 rounded border border-bg-surface"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-primary font-mono">
                        {key}
                      </span>
                      <button
                        onClick={() => handleToggleEnvVisibility(key)}
                        className="text-text-muted hover:text-text-primary transition-colors"
                      >
                        {visibleEnvKeys.has(key) ? (
                          <EyeOff size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-xs text-text-secondary break-all">
                      {visibleEnvKeys.has(key) ? value : '••••••••••••••••'}
                    </div>
                  </div>
                ))}
              {Object.keys(bot.env).filter(
                (key) => !['PRIVATE_KEY', 'WALLET_ADDRESS', 'BOT_ID', 'BOT_NAME'].includes(key)
              ).length > 5 && !envShowAll && (
                <button
                  onClick={() => setEnvShowAll(true)}
                  className="w-full text-xs text-primary hover:text-primary-light py-1"
                >
                  Show all ({Object.keys(bot.env).filter(
                    (key) => !['PRIVATE_KEY', 'WALLET_ADDRESS', 'BOT_ID', 'BOT_NAME'].includes(key)
                  ).length} total)
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 bg-bg-surface/30 rounded-lg border border-bg-surface text-center">
              <Settings size={24} className="text-text-muted mx-auto mb-2" />
              <p className="text-xs text-text-muted">No custom environment variables</p>
              <p className="text-xs text-text-muted mt-1">
                Click Edit to add environment variables
              </p>
            </div>
          )}
        </div>

        {/* Status & Metrics */}
        <div className="p-4 border-b border-bg-surface space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="text-primary" size={16} />
            <span className="text-xs font-accent text-text-secondary uppercase tracking-wider">
              Performance
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-bg-surface/30 rounded-lg">
            <span className="text-sm text-text-secondary">Status</span>
            <span
              className={cn(
                'text-sm font-semibold capitalize px-2 py-1 rounded',
                bot.status.state === 'running' && 'bg-success/20 text-success',
                bot.status.state === 'stopped' && 'bg-text-muted/20 text-text-muted',
                bot.status.state === 'error' && 'bg-danger/20 text-danger'
              )}
            >
              {bot.status.state}
            </span>
          </div>

          {/* CPU */}
          {bot.status.cpu !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-primary" />
                  <span className="text-text-secondary">CPU</span>
                </div>
                <span className="font-mono font-semibold text-text-primary">
                  {formatPercentage(bot.status.cpu)}
                </span>
              </div>
              <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300"
                  style={{ width: `${Math.min(bot.status.cpu || 0, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Memory */}
          {bot.status.memory !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive size={14} className="text-primary" />
                  <span className="text-text-secondary">Memory</span>
                </div>
                <span className="font-mono font-semibold text-text-primary">
                  {formatPercentage(bot.status.memory)}
                </span>
              </div>
              <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-info to-primary transition-all duration-300"
                  style={{ width: `${Math.min(bot.status.memory || 0, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Uptime */}
          {bot.status.uptime && (
            <div className="flex items-center justify-between p-3 bg-bg-surface/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                <span className="text-sm text-text-secondary">Uptime</span>
              </div>
              <span className="font-mono text-sm font-semibold text-text-primary">
                {bot.status.uptime > 3600
                  ? `${Math.floor(bot.status.uptime / 3600)}h ${Math.floor((bot.status.uptime % 3600) / 60)}m`
                  : bot.status.uptime > 60
                  ? `${Math.floor(bot.status.uptime / 60)}m`
                  : `${Math.floor(bot.status.uptime)}s`}
              </span>
            </div>
          )}
        </div>

        {/* Processing Tasks */}
        <div className="p-4 border-b border-bg-surface">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="text-primary" size={16} />
            <span className="text-xs font-accent text-text-secondary uppercase tracking-wider">
              Processing Tasks
            </span>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-bg-surface/30 rounded-lg border border-bg-surface hover:border-bg-hover transition-colors"
              >
                <div className="flex items-start gap-2 mb-2">
                  {getTaskIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">{task.title}</div>
                    <div className="text-xs text-text-muted">
                      {new Date(task.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                {task.status === 'processing' && task.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!showChat && (
      <div className="p-4 border-t border-bg-surface bg-bg-base/50 space-y-2 flex-shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {bot.status.state === 'stopped' ? (
            <Button onClick={onStart} variant="success" size="sm" leftIcon={<Play size={16} />}>
              Start
            </Button>
          ) : (
            <Button onClick={onStop} variant="secondary" size="sm" leftIcon={<Square size={16} />}>
              Stop
            </Button>
          )}
          <Button onClick={onRestart} variant="secondary" size="sm" leftIcon={<RotateCw size={16} />}>
            Restart
          </Button>
          <Button onClick={onViewLogs} variant="secondary" size="sm" leftIcon={<FileText size={16} />}>
            Logs
          </Button>
        </div>
        <Button onClick={onDelete} variant="danger" size="sm" fullWidth leftIcon={<Trash2 size={16} />}>
          Delete Container
        </Button>
      </div>
      )}

      {/* Subdomain Creation Modal */}
      <Modal
        isOpen={subdomainModalOpen}
        onClose={() => {
          setSubdomainModalOpen(false);
          setSubdomainName('');
          setSubdomainTxHash(null);
          setSubdomainError(null);
        }}
        title="Create ENS Subdomain"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary mb-4">
              Create a subdomain for this container to make it easily accessible via ENS.
            </p>

            {/* Warning if master wallet has no ENS name */}
            {!masterWallet?.ensName && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-warning flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-xs text-text-secondary space-y-1">
                    <p className="font-semibold text-warning">Master Wallet Has No ENS Name</p>
                    <p>Your master wallet ({masterWallet?.address.slice(0, 6)}...{masterWallet?.address.slice(-4)}) does not have an ENS name.</p>
                    <p>Please register an ENS name for your master wallet first to create subdomains.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview - only show if master wallet has ENS */}
            {masterWallet?.ensName && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="text-primary" size={16} />
                  <span className="text-xs font-accent text-primary uppercase">Preview</span>
                </div>
                <div className="font-mono text-sm text-text-primary">
                  {subdomainName || 'your-name'}.{masterWallet.ensName}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-accent text-text-secondary mb-2 uppercase tracking-wider">
              Subdomain Name
            </label>
            <Input
              type="text"
              value={subdomainName}
              onChange={(e) => setSubdomainName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="container-name"
              fullWidth
            />
            <p className="text-xs text-text-muted mt-1">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>

          <div className="p-3 bg-bg-surface/50 rounded-lg border border-bg-surface">
            <div className="text-xs text-text-muted space-y-1">
              <p>• Subdomain will point to: {bot.wallet?.address || 'N/A'}</p>
              <p>• This is a permanent action</p>
              <p>• Gas fees will apply (~0.01 ETH)</p>
            </div>
          </div>

          {/* Success Status */}
          {subdomainTxHash && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="text-success flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-text-secondary space-y-1 flex-1">
                  <p className="font-semibold text-success">Subdomain Created!</p>
                  <p className="text-text-primary">Your subdomain has been registered.</p>
                  <p className="text-text-muted">Transaction Hash:</p>
                  <div className="flex items-center gap-2 p-2 bg-bg-surface/50 rounded border border-success/20">
                    <code className="font-mono text-xs text-text-primary break-all flex-1">
                      {subdomainTxHash}
                    </code>
                    <IconButton
                      onClick={() => {
                        navigator.clipboard.writeText(subdomainTxHash);
                      }}
                      variant="ghost"
                      size="sm"
                      aria-label="Copy transaction hash"
                      className="flex-shrink-0"
                    >
                      <Copy size={12} />
                    </IconButton>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${subdomainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-light underline inline-flex items-center gap-1"
                  >
                    View on Etherscan
                    <Globe size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Error Status */}
          {subdomainError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-text-secondary space-y-1">
                  <p className="font-semibold text-danger">Creation Failed</p>
                  <p className="text-text-primary">{subdomainError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleCreateSubdomain}
              variant="primary"
              size="lg"
              fullWidth
              disabled={
                !masterWallet?.ensName ||
                !subdomainName ||
                subdomainName.length < 3 ||
                creatingSubdomain ||
                !!subdomainTxHash
              }
              leftIcon={
                creatingSubdomain ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />
              }
              className="shadow-glow-md hover:shadow-glow-lg font-bold"
            >
              {creatingSubdomain ? 'Creating...' : subdomainTxHash ? 'Created!' : 'Create Subdomain'}
            </Button>
            <Button
              onClick={() => {
                setSubdomainModalOpen(false);
                setSubdomainName('');
                setSubdomainTxHash(null);
                setSubdomainError(null);
              }}
              variant="secondary"
              size="lg"
            >
              {subdomainTxHash ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Send ETH Modal */}
      <Modal
        isOpen={sendEthModalOpen}
        onClose={() => {
          setSendEthModalOpen(false);
          setSendAmount('');
          setRecipientAddress('');
        }}
        title="Send ETH"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary mb-4">
              Send ETH from this container's wallet to another address.
            </p>

            {/* Current Balance */}
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="text-primary" size={16} />
                <span className="text-xs font-accent text-primary uppercase">Current Balance</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-text-primary">{containerBalance}</span>
                <span className="text-sm text-text-muted">ETH</span>
              </div>
            </div>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-sm font-accent text-text-secondary mb-2 uppercase tracking-wider">
              Recipient Address
            </label>
            <Input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              fullWidth
            />
            {recipientAddress && !isValidAddress(recipientAddress) && (
              <p className="text-xs text-danger mt-1">Invalid Ethereum address</p>
            )}
            {recipientAddress && isValidAddress(recipientAddress) && (
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <Check size={12} /> Valid address
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-accent text-text-secondary mb-2 uppercase tracking-wider">
              Amount (ETH)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.0"
                step="0.0001"
                min="0"
                max={containerBalance}
                fullWidth
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSendAmount(containerBalance)}
                className="whitespace-nowrap"
              >
                Max
              </Button>
            </div>
            {sendAmount && parseFloat(sendAmount) > parseFloat(containerBalance) && (
              <p className="text-xs text-danger mt-1">Insufficient balance</p>
            )}
          </div>

          {/* Transaction Summary */}
          {sendAmount && parseFloat(sendAmount) > 0 && (
            <div className="p-3 bg-bg-surface/50 rounded-lg border border-bg-surface space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Transaction Summary</div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Amount</span>
                <span className="font-mono text-text-primary">{sendAmount} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Gas Fee (estimated)</span>
                <span className="font-mono text-text-primary">{mockGasFee} ETH</span>
              </div>
              <div className="border-t border-bg-surface pt-2 mt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-text-primary">Total</span>
                  <span className="font-mono text-primary">{totalAmount} ETH</span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-warning flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-text-secondary space-y-1">
                <p className="font-semibold text-warning">Please verify before sending</p>
                <p>• Double-check the recipient address</p>
                <p>• Transactions cannot be reversed</p>
                <p>• Ensure sufficient balance for gas fees</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSendEth}
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canSend}
              leftIcon={<Send size={18} />}
              className="shadow-glow-md hover:shadow-glow-lg font-bold"
            >
              Send ETH
            </Button>
            <Button
              onClick={() => {
                setSendEthModalOpen(false);
                setSendAmount('');
                setRecipientAddress('');
              }}
              variant="secondary"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Fund from Master Modal */}
      <Modal
        isOpen={fundModalOpen}
        onClose={() => {
          setFundModalOpen(false);
          setFundAmount('');
          setTransactionHash(null);
          setTransactionError(null);
        }}
        title="Fund from Master Wallet"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary mb-4">
              Send ETH from your Master Wallet to this container's wallet.
            </p>

            {/* Master Wallet Balance */}
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="text-primary" size={16} />
                <span className="text-xs font-accent text-primary uppercase">Master Wallet Balance</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-text-primary">
                  {masterWalletBalance.toFixed(4)}
                </span>
                <span className="text-sm text-text-muted">ETH</span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-accent text-text-secondary mb-2 uppercase tracking-wider">
              Amount (ETH)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="0.0"
                step="0.0001"
                min="0"
                max={masterWalletBalance.toString()}
                fullWidth
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => setFundAmount(masterWalletBalance.toString())}
                className="whitespace-nowrap"
              >
                Max
              </Button>
            </div>
            {fundAmount && parseFloat(fundAmount) > masterWalletBalance && (
              <p className="text-xs text-danger mt-1">Insufficient master wallet balance</p>
            )}
          </div>

          {/* Transaction Summary */}
          {fundAmount && parseFloat(fundAmount) > 0 && (
            <div className="p-3 bg-bg-surface/50 rounded-lg border border-bg-surface space-y-2">
              <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Transaction Summary</div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Amount</span>
                <span className="font-mono text-text-primary">{fundAmount} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Gas Fee (estimated)</span>
                <span className="font-mono text-text-primary">0.0021 ETH</span>
              </div>
              <div className="border-t border-bg-surface pt-2 mt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-text-primary">Total</span>
                  <span className="font-mono text-primary">
                    {(parseFloat(fundAmount) + 0.0021).toFixed(4)} ETH
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Wallet className="text-info flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-text-secondary space-y-1">
                <p className="font-semibold text-info">Funding Container Wallet</p>
                <p>• Funds will be sent from master wallet to {bot.name}</p>
                <p>• The container can use these funds for transactions</p>
                <p>• Transaction cannot be reversed</p>
              </div>
            </div>
          </div>

          {/* Transaction Status */}
          {transactionHash && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="text-success flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-text-secondary space-y-1 flex-1">
                  <p className="font-semibold text-success">Transaction Sent!</p>
                  <p className="text-text-muted">Transaction Hash:</p>
                  <div className="flex items-center gap-2 p-2 bg-bg-surface/50 rounded border border-success/20">
                    <code className="font-mono text-xs text-text-primary break-all flex-1">
                      {transactionHash}
                    </code>
                    <IconButton
                      onClick={() => {
                        navigator.clipboard.writeText(transactionHash);
                      }}
                      variant="ghost"
                      size="sm"
                      aria-label="Copy transaction hash"
                      className="flex-shrink-0"
                    >
                      <Copy size={12} />
                    </IconButton>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-light underline inline-flex items-center gap-1"
                  >
                    View on Etherscan
                    <Globe size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Error */}
          {transactionError && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-text-secondary space-y-1">
                  <p className="font-semibold text-danger">Transaction Failed</p>
                  <p className="text-text-primary">{transactionError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleFundFromMaster}
              variant="primary"
              size="lg"
              fullWidth
              disabled={
                !fundAmount ||
                parseFloat(fundAmount) <= 0 ||
                parseFloat(fundAmount) > masterWalletBalance ||
                sendingTransaction
              }
              leftIcon={
                sendingTransaction ? <Loader2 size={18} className="animate-spin" /> : <ArrowDownToLine size={18} />
              }
              className="shadow-glow-md hover:shadow-glow-lg font-bold"
            >
              {sendingTransaction ? 'Sending...' : 'Fund to bot'}
            </Button>
            <Button
              onClick={() => {
                setFundModalOpen(false);
                setFundAmount('');
                setTransactionHash(null);
                setTransactionError(null);
              }}
              variant="secondary"
              size="lg"
            >
              {transactionHash ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Environment Variables Edit Modal */}
      <Modal
        isOpen={envModalOpen}
        onClose={() => {
          setEnvModalOpen(false);
          setEditedEnv({});
        }}
        title="Edit Environment Variables"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary mb-4">
              Add or modify environment variables for this container. The container will be recreated with the new configuration.
            </p>

            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-warning flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-text-secondary space-y-1">
                  <p className="font-semibold text-warning">Important Notes</p>
                  <p>• The container will be stopped and recreated</p>
                  <p>• Sensitive variables (PRIVATE_KEY, WALLET_ADDRESS) cannot be modified</p>
                  <p>• Changes take effect immediately after recreation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Environment Variables List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(editedEnv).map(([key, value]) => (
              <div
                key={key}
                className="p-3 bg-bg-surface/50 rounded-lg border border-bg-surface"
              >
                <div className="flex gap-2 mb-2">
                  <Input
                    value={key}
                    onChange={(e) => handleEnvKeyChange(key, e.target.value)}
                    placeholder="KEY"
                    className="font-mono text-xs"
                  />
                  <IconButton
                    onClick={() => handleRemoveEnvVar(key)}
                    variant="ghost"
                    size="sm"
                    aria-label="Remove variable"
                    className="flex-shrink-0"
                  >
                    <Minus size={14} className="text-danger" />
                  </IconButton>
                </div>
                <Input
                  value={value}
                  onChange={(e) => handleEnvValueChange(key, e.target.value)}
                  placeholder="value"
                  className="font-mono text-xs"
                  fullWidth
                />
              </div>
            ))}

            {Object.keys(editedEnv).length === 0 && (
              <div className="p-4 bg-bg-surface/30 rounded-lg border border-bg-surface text-center">
                <Settings size={24} className="text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-muted">No environment variables</p>
                <p className="text-xs text-text-muted mt-1">Click "Add Variable" to create one</p>
              </div>
            )}
          </div>

          {/* Add Variable Button */}
          <Button
            onClick={handleAddEnvVar}
            variant="secondary"
            size="md"
            leftIcon={<Plus size={14} />}
            fullWidth
          >
            Add Variable
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSaveEnv}
              variant="primary"
              size="lg"
              fullWidth
              disabled={recreating}
              leftIcon={
                recreating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />
              }
              className="shadow-glow-md hover:shadow-glow-lg font-bold"
            >
              {recreating ? 'Recreating Container...' : 'Save & Recreate'}
            </Button>
            <Button
              onClick={() => {
                setEnvModalOpen(false);
                setEditedEnv({});
              }}
              variant="secondary"
              size="lg"
              disabled={recreating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
