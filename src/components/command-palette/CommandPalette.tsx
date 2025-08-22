import { useState, useEffect, useRef } from 'react';
import { Search, Command as CommandIcon } from 'lucide-react';
import { CommandRegistry, type Command } from '../../lib/command-palette/command-registry';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [registry] = useState(() => new CommandRegistry());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setCommands(registry.getAllCommands());
      inputRef.current?.focus();
    }
  }, [isOpen, registry]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = registry.searchCommands(query);
      setCommands(filtered);
    } else {
      setCommands(registry.getAllCommands());
    }
    setSelectedIndex(0);
  }, [query, registry]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, commands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (commands[selectedIndex]) {
          registry.executeCommand(commands[selectedIndex].id);
          onClose();
        }
        break;
    }
  };

  const handleCommandClick = (command: Command) => {
    registry.executeCommand(command.id);
    onClose();
  };

  const getCategoryColor = (category: Command['category']) => {
    const colors = {
      navigation: 'bg-blue-100 text-blue-700',
      automation: 'bg-green-100 text-green-700',
      search: 'bg-purple-100 text-purple-700',
      intelligence: 'bg-orange-100 text-orange-700',
      memory: 'bg-pink-100 text-pink-700',
      settings: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.settings;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 text-lg bg-transparent border-none outline-none"
          />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <CommandIcon className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {commands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No commands found</p>
            </div>
          ) : (
            <div className="p-2">
              {commands.map((command, index) => (
                <div
                  key={command.id}
                  onClick={() => handleCommandClick(command)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                    index === selectedIndex ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{command.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{command.title}</span>
                      <span className={`px-2 py-1 text-xs rounded ${getCategoryColor(command.category)}`}>
                        {command.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{command.description}</p>
                  </div>
                  {command.shortcut && (
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {command.shortcut}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
          <span>{commands.length} commands</span>
        </div>
      </div>
    </div>
  );
};