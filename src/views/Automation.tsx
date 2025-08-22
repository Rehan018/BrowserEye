import { useState } from 'react';
import { Bot, List, Settings } from 'lucide-react';
import { WorkflowBuilder } from '../components/automation/WorkflowBuilder';
import { TaskMonitor } from '../components/automation/TaskMonitor';

const Automation = () => {
  const [activeTab, setActiveTab] = useState<'builder' | 'monitor' | 'settings'>('builder');

  const tabs = [
    { id: 'builder', label: 'Workflow Builder', icon: Bot },
    { id: 'monitor', label: 'Task Monitor', icon: List },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Automation</h1>
        <p className="text-sm text-gray-600">Create and manage automated workflows</p>
      </div>

      {/* Tab Navigation */}
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

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'builder' && <WorkflowBuilder />}
        {activeTab === 'monitor' && <TaskMonitor />}
        {activeTab === 'settings' && (
          <div className="p-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Automation Settings</h3>
              <p className="text-sm text-yellow-700">
                Configure automation preferences and safety settings here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Automation;