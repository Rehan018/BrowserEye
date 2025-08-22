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
    if (workflow.steps.length === 0) {
      alert('Please add at least one step to the workflow');
      return;
    }
    
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) {
        alert('No active tab found');
        return;
      }
      
      // Test connection first
      chrome.tabs.sendMessage(tabs[0].id, { type: 'PING' }, async (_response) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded, inject it
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id! },
              files: ['automation-content.js']
            });
            
            // Wait for injection and try again
            setTimeout(() => {
              chrome.tabs.sendMessage(tabs[0].id!, {
                type: 'EXECUTE_WORKFLOW',
                workflow
              }, (response) => {
                if (chrome.runtime.lastError) {
                  alert('Still failed to connect. Please refresh the page and try again.');
                  return;
                }
                
                if (response?.success) {
                  alert('Workflow executed successfully!');
                  console.log('Result:', response.result);
                } else {
                  alert('Workflow failed: ' + (response?.error || 'Unknown error'));
                }
              });
            }, 1000);
            
          } catch (injectionError) {
            alert('Failed to inject automation script. Please refresh the page.');
          }
        } else {
          // Content script is loaded, execute workflow
          chrome.tabs.sendMessage(tabs[0].id!, {
            type: 'EXECUTE_WORKFLOW',
            workflow
          }, (response) => {
            if (response?.success) {
              alert('Workflow executed successfully!');
              console.log('Result:', response.result);
            } else {
              alert('Workflow failed: ' + (response?.error || 'Unknown error'));
            }
          });
        }
      });
      
    } catch (error) {
      console.error('Workflow execution error:', error);
      alert('Failed to execute workflow: ' + (error as Error).message);
    }
  };

  const saveWorkflow = async () => {
    try {
      await chrome.storage.local.set({
        [`workflow_${workflow.id}`]: workflow
      });
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save workflow');
    }
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
              <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg p-2 space-y-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
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
                    <span className="text-lg">
                      {stepTypes.find(t => t.value === step.type)?.icon}
                    </span>
                    <div>
                      <div className="text-sm font-medium">
                        {stepTypes.find(t => t.value === step.type)?.label}
                      </div>
                      {step.target && (
                        <div className="text-xs text-gray-500 truncate max-w-32">
                          {step.target}
                        </div>
                      )}
                    </div>
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
              
              {(selectedStepData.type === 'click' || selectedStepData.type === 'type' || selectedStepData.type === 'extract') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Selector
                  </label>
                  <input
                    type="text"
                    value={selectedStepData.target || ''}
                    onChange={(e) => updateStep(selectedStepData.id, { target: e.target.value })}
                    placeholder="CSS selector (e.g., #button-id, .class-name)"
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
                    placeholder="Text to enter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {selectedStepData.type === 'wait' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wait Duration (ms)
                  </label>
                  <input
                    type="number"
                    value={selectedStepData.value || '1000'}
                    onChange={(e) => updateStep(selectedStepData.id, { value: e.target.value })}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {selectedStepData.type === 'navigate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={selectedStepData.value || ''}
                    onChange={(e) => updateStep(selectedStepData.id, { value: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {selectedStepData.type === 'extract' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variable Name
                  </label>
                  <input
                    type="text"
                    value={selectedStepData.value || ''}
                    onChange={(e) => updateStep(selectedStepData.id, { value: e.target.value })}
                    placeholder="variableName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {selectedStepData.type === 'condition' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={selectedStepData.condition || ''}
                    onChange={(e) => updateStep(selectedStepData.id, { condition: e.target.value })}
                    placeholder="exists:#element or contains:#element|text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={selectedStepData.timeout || 5000}
                  onChange={(e) => updateStep(selectedStepData.id, { timeout: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
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