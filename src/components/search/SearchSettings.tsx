import { useState, useEffect } from 'react';
import { Search, Zap } from 'lucide-react';

export const SearchSettings = () => {
  const [searchInterceptionEnabled, setSearchInterceptionEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current setting
    chrome.storage.local.get(['searchInterceptionEnabled'], (result) => {
      setSearchInterceptionEnabled(result.searchInterceptionEnabled ?? true);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setSearchInterceptionEnabled(enabled);
    
    // Save setting
    await chrome.storage.local.set({ searchInterceptionEnabled: enabled });
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'TOGGLE_SEARCH_INTERCEPTION',
      data: { enabled }
    });
  };

  if (loading) {
    return <div className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Search Interception</h3>
            <p className="text-sm text-gray-600">
              Replace search results with AI-generated answers
            </p>
          </div>
        </div>
        
        <button
          onClick={() => handleToggle(!searchInterceptionEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            searchInterceptionEnabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              searchInterceptionEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {searchInterceptionEnabled && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Search queries will be intercepted and enhanced with AI-generated comprehensive answers
          </p>
        </div>
      )}
    </div>
  );
};