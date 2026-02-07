import { Plus, Box } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  onCreateBot: () => void;
}

export function EmptyState({ onCreateBot }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="w-24 h-24 rounded-full bg-bg-surface border-2 border-dashed border-primary/30 flex items-center justify-center mb-6">
        <Box size={40} className="text-primary/50" strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-bold font-mono text-text-primary mb-2">
        No Bots Created Yet
      </h2>

      <p className="text-text-secondary mb-8 max-w-md text-center">
        Get started by creating your first bot. Deploy and manage Docker containers with ease.
      </p>

      <Button
        onClick={onCreateBot}
        variant="primary"
        size="lg"
        leftIcon={<Plus size={22} />}
        className="shadow-glow-md hover:shadow-glow-lg font-bold text-lg px-8 py-4 border-2 border-primary hover:border-primary-light"
      >
        Create Your First Bot
      </Button>
    </div>
  );
}
