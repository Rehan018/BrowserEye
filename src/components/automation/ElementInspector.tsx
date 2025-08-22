import { useState } from 'react';
import { Eye, Target, Copy, Check } from 'lucide-react';
import type { ElementInfo } from '../../lib/automation/element-detector';

export const ElementInspector = () => {
  const [elements, setElements] = useState<ElementInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedSelector, setCopiedSelector] = useState<string | null>(null);

  const detectElements = async () => {
    setLoading(true);
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'DETECT_ELEMENTS'
          }, (response) => {
            if (response?.success) {
              setElements(response.elements || []);
            } else {
              console.error('Element detection failed:', response?.error);
              setElements([]);
            }
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Element detection error:', error);
      setLoading(false);
    }
  };

  const copySelector = async (selector: string) => {
    try {
      await navigator.clipboard.writeText(selector);
      setCopiedSelector(selector);
      setTimeout(() => setCopiedSelector(null), 2000);
    } catch (error) {
      console.error('Failed to copy selector:', error);
    }
  };

  const getTypeIcon = (type: ElementInfo['type']) => {
    const icons = {
      button: '🔘',
      input: '📝',
      link: '🔗',
      form: '📋',
      text: '📄',
      image: '🖼️',
      other: '❓'
    };
    return icons[type] || icons.other;
  };

  const getTypeColor = (type: ElementInfo['type']) => {
    const colors = {
      button: 'bg-blue-100 text-blue-700',
      input: 'bg-green-100 text-green-700',
      link: 'bg-purple-100 text-purple-700',
      form: 'bg-orange-100 text-orange-700',
      text: 'bg-gray-100 text-gray-700',
      image: 'bg-pink-100 text-pink-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Element Inspector</h3>
        </div>
        <button
          onClick={detectElements}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Target className="w-4 h-4" />
          {loading ? 'Detecting...' : 'Detect Elements'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Analyzing page elements...</p>
        </div>
      )}

      {!loading && elements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No interactive elements detected</p>
          <p className="text-sm">Click "Detect Elements" to scan the current page</p>
        </div>
      )}

      {!loading && elements.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <div className="text-sm text-gray-600 mb-3">
            Found {elements.length} interactive elements
          </div>
          
          {elements.map((element, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-lg">{getTypeIcon(element.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(element.type)}`}>
                        {element.type}
                      </span>
                      {element.isClickable && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          clickable
                        </span>
                      )}
                      {element.isVisible && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          visible
                        </span>
                      )}
                    </div>
                    
                    {element.text && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {element.text}
                      </p>
                    )}
                    
                    <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-800 break-all">
                      {element.selector}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      Position: {Math.round(element.position.x)}, {Math.round(element.position.y)} • 
                      Size: {Math.round(element.position.width)}×{Math.round(element.position.height)}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => copySelector(element.selector)}
                  className="p-1 text-gray-400 hover:text-blue-600 ml-2"
                  title="Copy selector"
                >
                  {copiedSelector === element.selector ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};