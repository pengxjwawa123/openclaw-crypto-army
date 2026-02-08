import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; image: string; env: Record<string, string> }) => void;
}

// Available bot images
const AVAILABLE_IMAGES = [
  {
    id: 'foundry',
    name: 'OpenClaw + Foundry (Recommended)',
    image: 'openclaw-foundry:custom',
    description: 'Custom image with Foundry Cast pre-installed for blockchain interactions'
  }
];

const DEFAULT_BOT_IMAGE = AVAILABLE_IMAGES[0].image; // Foundry image by default

export function CreateBotModal({ isOpen, onClose, onCreate }: CreateBotModalProps) {
  const [name, setName] = useState('');
  const [selectedImage, setSelectedImage] = useState(DEFAULT_BOT_IMAGE);
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const env: Record<string, string> = {};
    envVars.forEach(({ key, value }) => {
      if (key.trim()) {
        env[key.trim()] = value;
      }
    });

    // Use the selected image
    onCreate({ name, image: selectedImage, env });

    // Reset form
    setName('');
    setSelectedImage(DEFAULT_BOT_IMAGE);
    setEnvVars([{ key: '', value: '' }]);
    onClose();
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Bot" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-accent text-text-secondary mb-2 uppercase tracking-wider">
              Bot Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-trading-bot"
              required
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-accent text-text-secondary mb-3 uppercase tracking-wider">
              Docker Image
            </label>
            <div className="space-y-2">
              {AVAILABLE_IMAGES.map((imageOption) => (
                <label
                  key={imageOption.id}
                  className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedImage === imageOption.image
                      ? 'border-primary bg-primary/10 shadow-glow-sm'
                      : 'border-surface-elevated bg-surface hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="image"
                      value={imageOption.image}
                      checked={selectedImage === imageOption.image}
                      onChange={(e) => setSelectedImage(e.target.value)}
                      className="mt-1 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="font-display text-text-primary font-semibold mb-1">
                        {imageOption.name}
                      </div>
                      <div className="text-xs text-text-secondary font-mono mb-1">
                        {imageOption.image}
                      </div>
                      <div className="text-xs text-text-muted">
                        {imageOption.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-accent text-text-secondary uppercase tracking-wider">
                Environment Variables
              </label>
              <Button
                type="button"
                onClick={addEnvVar}
                variant="ghost"
                size="sm"
                leftIcon={<Plus size={16} />}
              >
                Add Variable
              </Button>
            </div>

            <div className="space-y-2">
              {envVars.map((env, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="text"
                    value={env.key}
                    onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                    placeholder="KEY"
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    value={env.value}
                    onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                    placeholder="value"
                    className="flex-1"
                  />
                  <IconButton
                    type="button"
                    onClick={() => removeEnvVar(index)}
                    variant="danger"
                    aria-label="Remove variable"
                  >
                    <X size={20} />
                  </IconButton>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            className="shadow-glow-md hover:shadow-glow-lg font-bold border-2 border-primary hover:border-primary-light"
          >
            Create Bot
          </Button>
          <Button type="button" onClick={onClose} variant="secondary" size="lg">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
