import { useState } from 'react';
import { Plus, Play, Save, Trash2 } from 'lucide-react';
import type { Workflow, WorkflowStep } from '../../lib/automation/workflow-engine';

export const WorkflowBuilder = () => {
  const [workflow, setWorkflow] = useState<Workflow>({
    id: crypto.randomUUID(),
    name: 'New Workflow',
    description: '',
    steps: [],
    variables: {}
  });
  
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const stepTypes = [
    { value: 'click', label: 'Click Element', icon: '👆' },
    { value: 'type', label: 'Type Text', icon: '⌨️' },
    { value: 'wait', label: 'Wait', icon: '⏱️' },
    { value: 'navigate', label: 'Navigate', icon: '🔗' },
    { value: 'extract', label: 'Extract Data', icon: '📤' },
    { value: 'condition', label: 'Condition', icon: '❓' }
  ];

  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      type,
      timeout: 5000
    };

    setWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    
    setSelectedStep(newStep.id);
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  };

  const deleteStep = (stepId: string) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
    
    if (selectedStep === stepId) {
      setSelectedStep(null);
    }
  };

  const executeWorkflow = async () => {
    chrome.runtime.sendMessage({
      type: 'EXECUTE_WORKFLOW',
      workflow
    });
  };

  const saveWorkflow = async () => {
    await chrome.storage.local.set({
      [`workflow_${workflow.id}`]: workflow
    });
  };

  const selectedStepData = workflow.steps.find(s => s.id === selectedStep);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <input
            type="text"
            value={workflow.name}
            onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={executeWorkflow}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
          <button
            onClick={saveWorkflow}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Steps</h3>
            <div className="relative group">
              <button className="p-1 text-gray-400 hover:text-blue-600">
                <Plus className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg p-2 space-y-1 hidden group-hover:block z-10">
                {stepTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => addStep(type.value as WorkflowStep['type'])}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    <span>{type.icon}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {workflow.steps.map((step, index) => (
              <div
                key={step.id}
                onClick={() => setSelectedStep(step.id)}
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedStep === step.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">
                      {stepTypes.find(t => t.value === step.type)?.label}
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStep(step.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          {selectedStepData ? (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">
                Edit {stepTypes.find(t => t.value === selectedStepData.type)?.label}
              </h3>
              
              {(selectedStepData.type === 'click' || selectedStepData.type === 'type') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Selector
                  </label>
                  <input
                    type="text"
                    value={selectedStepData.target || ''}
                    onChange={(e) => updateStep(selectedStepData.id, { target: e.target.value })}
                    placeholder="CSS selector"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {selectedStepData.type === 'type' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text to Type
                  </label>
                  <input
                    type="text"
                    value={selectedStepData.value || ''}
                    onChange={(e) => updateStep(selectedStepData.id, { value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Select a step to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};