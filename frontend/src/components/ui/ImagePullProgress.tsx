import { useEffect, useState } from 'react';
import { Download, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

interface ImagePullProgressProps {
  isVisible: boolean;
  status: 'pulling' | 'creating' | 'success' | 'error';
  message?: string;
  progress?: number;
}

export function ImagePullProgress({ isVisible, status, message, progress }: ImagePullProgressProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (status === 'pulling' || status === 'creating') {
      const interval = setInterval(() => {
        setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <div className="bg-bg-elevated border-2 border-bg-surface rounded-lg shadow-2xl p-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {status === 'pulling' && (
              <div className="relative">
                <Download
                  className="text-primary animate-bounce"
                  size={48}
                  strokeWidth={2.5}
                />
                <div className="absolute inset-0 animate-ping">
                  <Download className="text-primary opacity-30" size={48} />
                </div>
              </div>
            )}
            {status === 'creating' && (
              <Loader2
                className="text-primary animate-spin"
                size={48}
                strokeWidth={2.5}
              />
            )}
            {status === 'success' && (
              <CheckCircle className="text-success" size={48} strokeWidth={2.5} />
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-center text-primary mb-2 font-display">
            {status === 'pulling' && 'Pulling Docker Image'}
            {status === 'creating' && 'Creating Container'}
            {status === 'success' && 'Bot Created Successfully!'}
          </h2>

          {/* Message */}
          <p className="text-center text-text-secondary mb-4 font-mono text-sm">
            {message || (status === 'pulling' ? 'Downloading OpenClaw image' : 'Setting up bot container')}
            {(status === 'pulling' || status === 'creating') && (
              <span className="inline-block w-6 text-left">{dots}</span>
            )}
          </p>

          {/* Progress Bar */}
          {progress !== undefined && status === 'pulling' && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-text-muted mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300',
                    'shadow-glow-sm'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Spinner for indeterminate progress */}
          {progress === undefined && (status === 'pulling' || status === 'creating') && (
            <div className="mb-4">
              <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary via-primary-light to-primary animate-shimmer bg-[length:200%_100%]" />
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-4 p-3 bg-bg-surface/50 rounded border border-bg-surface">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="text-xs text-text-muted space-y-1">
                {status === 'pulling' && (
                  <>
                    <p>• First-time setup may take 1-2 minutes</p>
                    <p>• Image will be cached for future bots</p>
                  </>
                )}
                {status === 'creating' && (
                  <>
                    <p>• Configuring bot environment</p>
                    <p>• Injecting wallet credentials</p>
                    <p>• Starting container...</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
