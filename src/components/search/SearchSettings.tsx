import { useState, useEffect } from 'react';
import { Search, Zap, Shield } from 'lucide-react';

export const SearchInterceptionSettings = () => {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current setting
    chrome.storage.sync.get(['searchInterceptionEnabled'], (result) => {
      setEnabled(result.searchInterceptionEnabled !== false);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (newEnabled: boolean) => {
    setEnabled(newEnabled);
    await chrome.storage.sync.set({ searchInterceptionEnabled: newEnabled });
  };

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Search Enhancement</h3>
            <p className="text-sm text-gray-600">
              Replace search results with AI-generated answers
            </p>
          </div>
        </div>
        
        <button
          onClick={() => handleToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {enabled && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Zap className="w-4 h-4" />
            <span>AI answers will appear on Google, Bing, DuckDuckGo, and Yahoo</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Shield className="w-4 h-4" />
            <span>Sources are cited and original results remain accessible</span>
          </div>
        </div>
      )}
    </div>
  );
};