import { useState, useEffect } from 'react';
import { Highlighter, Eye } from 'lucide-react';


export const SmartHighlighter = () => {
  const [isEnabled, setIsEnabled] = useState(false);


  useEffect(() => {
    // Load saved state
    chrome.storage.local.get(['smartHighlightingEnabled'], (result) => {
      setIsEnabled(result.smartHighlightingEnabled ?? false);
    });
  }, []);

  useEffect(() => {
    if (isEnabled) {
      enableHighlighting();
    } else {
      disableHighlighting();
    }
  }, [isEnabled]);

  const enableHighlighting = () => {
    // Send message to content script to enable highlighting
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'ENABLE_SMART_HIGHLIGHTING'
        });
      }
    });
  };

  const disableHighlighting = () => {
    // Send message to content script to disable highlighting
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'DISABLE_SMART_HIGHLIGHTING'
        });
      }
    });
  };

  const handleToggle = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    // Save state
    await chrome.storage.local.set({ smartHighlightingEnabled: newState });
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Highlighter className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Smart Highlighting</h3>
            <p className="text-sm text-gray-600">
              Automatically highlight important content
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {isEnabled && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Important content, statistics, and key information will be highlighted on this page
          </p>
          
          {/* Legend */}
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-yellow-800">Highlight Types:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-blue-500 rounded"></div>
                <span>Statistics</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-red-500 rounded"></div>
                <span>Important</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-green-500 rounded"></div>
                <span>Definitions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-orange-500 rounded"></div>
                <span>Warnings</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};