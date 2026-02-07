import { useEffect, useState } from 'react';
import { Wallet, RefreshCw, Copy, Check } from 'lucide-react';
import { api } from '../../api';
import { MasterWallet as MasterWalletType } from '../../types';
import { IconButton } from '../ui/IconButton';

export function MasterWallet() {
  const [wallet, setWallet] = useState<MasterWalletType | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-2 bg-bg-surface/50 rounded-lg border border-bg-hover backdrop-blur-sm animate-pulse">
        <div className="h-12 w-48 bg-bg-hover rounded" />
      </div>
    );
  }

  if (!wallet) return null;

  // Get total balance in ETH (assuming all networks use 18 decimals)
  const totalBalance = Object.values(wallet.balances).reduce((sum, { formatted }) => {
    return sum + parseFloat(formatted);
  }, 0);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-bg-surface/50 rounded-lg border border-bg-hover backdrop-blur-sm">
      <Wallet className="text-primary" size={24} />

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-accent text-text-muted uppercase tracking-wider">
            Master Wallet
          </span>
          <IconButton
            onClick={fetchWallet}
            variant="ghost"
            size="xs"
            aria-label="Refresh balance"
            className={refreshing ? 'animate-spin' : ''}
          >
            <RefreshCw size={12} />
          </IconButton>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-text-primary truncate max-w-[120px]">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </span>
          <IconButton
            onClick={copyAddress}
            variant="ghost"
            size="xs"
            aria-label="Copy address"
          >
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          </IconButton>
        </div>
      </div>

      <div className="w-px h-10 bg-bg-hover" />

      <div className="flex flex-col">
        <span className="text-xs font-accent text-text-muted uppercase tracking-wider">
          Balance
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-mono font-bold text-primary">
            {totalBalance.toFixed(4)}
          </span>
          <span className="text-xs text-text-muted">ETH</span>
        </div>

        {Object.keys(wallet.balances).length > 1 && (
          <div className="flex gap-2 mt-1">
            {Object.entries(wallet.balances).map(([network, { formatted }]) => (
              <span key={network} className="text-xs text-text-muted font-mono">
                {network.toUpperCase()}: {parseFloat(formatted).toFixed(4)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
