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

export function CreateBotModal({ isOpen, onClose, onCreate }: CreateBotModalProps) {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
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

    onCreate({ name, image, env });

    // Reset form
    setName('');
    setImage('');
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
              placeholder="my-bot"
              required
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-accent text-text-secondary mb-2 uppercase tracking-wider">
              Docker Image
            </label>
            <Input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="openclaw/bot:latest"
              required
              fullWidth
            />
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
          <Button type="submit" variant="primary" size="md" fullWidth>
            Create Bot
          </Button>
          <Button type="button" onClick={onClose} variant="secondary" size="md">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
