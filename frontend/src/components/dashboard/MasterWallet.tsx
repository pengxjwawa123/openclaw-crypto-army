import { useEffect, useState, useRef } from 'react';
import { Wallet, RefreshCw, Copy, Check, ChevronDown } from 'lucide-react';
import { api } from '../../api';
import { MasterWallet as MasterWalletType } from '../../types';
import { IconButton } from '../ui/IconButton';
import { cn } from '../../lib/cn';

export function MasterWallet() {
  const [wallet, setWallet] = useState<MasterWalletType | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchWallet = async () => {
    try {
      setRefreshing(true);
      const data = await api.getMasterWallet();
      setWallet(data);
    } catch (error) {
      console.error('Failed to fetch master wallet:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    // Refresh every 30 seconds
    const interval = setInterval(fetchWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="px-3 py-1.5 bg-bg-surface/30 rounded-md animate-pulse">
        <div className="h-8 w-32 bg-bg-hover rounded" />
      </div>
    );
  }

  if (!wallet) return null;

  // Get total balance in ETH (assuming all networks use 18 decimals)
  const totalBalance = Object.values(wallet.balances).reduce((sum, { formatted }) => {
    return sum + parseFloat(formatted);
  }, 0);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface/30 rounded-md hover:bg-bg-surface/50 transition-colors"
      >
        <Wallet className="text-primary" size={16} />
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-mono font-bold text-primary">
            {totalBalance.toFixed(4)}
          </span>
          <span className="text-xs text-text-muted">ETH</span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            'text-text-muted transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-bg-elevated border border-bg-surface rounded-lg shadow-xl z-50 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-bg-surface">
            <div className="flex items-center gap-2">
              <Wallet className="text-primary" size={20} />
              <div className="flex flex-col">
                <span className="text-sm font-accent text-text-secondary uppercase tracking-wider">
                  Master Wallet
                </span>
                {wallet.ensName && (
                  <span className="text-sm font-semibold text-primary">
                    {wallet.ensName}
                  </span>
                )}
              </div>
            </div>
            <IconButton
              onClick={fetchWallet}
              variant="ghost"
              size="sm"
              aria-label="Refresh balance"
              className={refreshing ? 'animate-spin' : ''}
            >
              <RefreshCw size={14} />
            </IconButton>
          </div>

          {/* ENS Name (if available) */}
          {wallet.ensName && (
            <div className="mb-3">
              <span className="text-xs text-text-muted uppercase tracking-wider">ENS Name</span>
              <div className="flex items-center gap-2 mt-1 p-2 bg-primary/10 border border-primary/20 rounded">
                <span className="text-base font-semibold text-primary flex-1">
                  {wallet.ensName}
                </span>
                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-accent uppercase">
                  ENS
                </span>
              </div>
            </div>
          )}

          {/* Address */}
          <div className="mb-3">
            <span className="text-xs text-text-muted uppercase tracking-wider">
              {wallet.ensName ? 'Address' : 'Wallet Address'}
            </span>
            <div className="flex items-center gap-2 mt-1 p-2 bg-bg-surface/50 rounded">
              <span className="text-sm font-mono text-text-primary flex-1 truncate">
                {wallet.address}
              </span>
              <IconButton
                onClick={copyAddress}
                variant="ghost"
                size="sm"
                aria-label="Copy address"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </IconButton>
            </div>
          </div>

          {/* Total Balance */}
          <div className="mb-3">
            <span className="text-xs text-text-muted uppercase tracking-wider">Total Balance</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-primary">
                {totalBalance.toFixed(4)}
              </span>
              <span className="text-sm text-text-muted">ETH</span>
            </div>
          </div>

          {/* Network Breakdown */}
          {Object.keys(wallet.balances).length > 0 && (
            <div>
              <span className="text-xs text-text-muted uppercase tracking-wider">Networks</span>
              <div className="space-y-2 mt-2">
                {Object.entries(wallet.balances).map(([network, { formatted }]) => (
                  <div
                    key={network}
                    className="flex items-center justify-between p-2 bg-bg-surface/30 rounded"
                  >
                    <span className="text-xs font-accent text-text-secondary uppercase">
                      {network.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-mono font-semibold text-text-primary">
                      {parseFloat(formatted).toFixed(4)} ETH
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
