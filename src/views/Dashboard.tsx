import { useState } from 'react';
import { BarChart3, Command, Keyboard } from 'lucide-react';
import { Dashboard as AnalyticsDashboard } from '../components/analytics/Dashboard';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'commands' | 'shortcuts'>('analytics');

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'commands', label: 'Commands', icon: Command },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard }
  ];

  const shortcuts = [
    { key: 'Ctrl+K', description: 'Open command palette' },
    { key: 'Ctrl+1', description: 'Go to Chat' },
    { key: 'Ctrl+3', description: 'Go to Automation' },
    { key: 'Ctrl+N', description: 'New conversation' },
    { key: 'Ctrl+Shift+S', description: 'Toggle search interception' },
    { key: 'Ctrl+Shift+H', description: 'Toggle smart highlighting' }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Usage insights and command reference</p>
      </div>

      <div className="flex border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        
        {activeTab === 'commands' && (
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-2">Command Palette</h3>
              <p className="text-sm text-blue-700">
                Press <kbd className="px-2 py-1 bg-blue-100 rounded text-xs">Ctrl+K</kbd> to open the command palette and quickly access any feature.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Available Commands</h3>
              <div className="grid gap-3">
                {[
                  { category: 'Navigation', commands: ['Go to Chat', 'Go to Automation', 'Go to Settings'] },
                  { category: 'Search', commands: ['Toggle Search Interception'] },
                  { category: 'Intelligence', commands: ['Toggle Smart Highlighting'] },
                  { category: 'Memory', commands: ['New Conversation'] }
                ].map(group => (
                  <div key={group.category} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{group.category}</h4>
                    <div className="space-y-1">
                      {group.commands.map(cmd => (
                        <div key={cmd} className="text-sm text-gray-600">• {cmd}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'shortcuts' && (
          <div className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                {shortcuts.map(shortcut => (
                  <div key={shortcut.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;