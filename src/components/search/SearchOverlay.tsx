import { useState } from 'react';
import { X, Search, ExternalLink, Copy, Check } from 'lucide-react';
import type { AISearchResponse, SearchQuery } from '../../lib/search/search-interceptor';

interface SearchOverlayProps {
  query: SearchQuery;
  response: AISearchResponse | null;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export const SearchOverlay = ({ query, response, isLoading, onClose, onRetry }: SearchOverlayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (response?.answer) {
      await navigator.clipboard.writeText(response.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSourceClick = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900">AI Search Results</h2>
              <p className="text-sm text-gray-600">"{query.query}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Loading State */}
          {isLoading && (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing sources and generating comprehensive answer...</p>
            </div>
          )}

          {/* AI Response */}
          {response && !isLoading && (
            <div className="p-6 space-y-6">
              {/* Answer Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-900">AI-Generated Answer</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Confidence: {Math.round(response.confidence * 100)}%
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
                    </button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-gray-800">
                  {response.answer.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Sources Section */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Sources ({response.sources.length})
                </h3>
                <div className="grid gap-3">
                  {response.sources.map((source, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSourceClick(source.url)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              [{index + 1}]
                            </span>
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                              {source.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {source.snippet}
                          </p>
                          <p className="text-xs text-gray-500">{source.source}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={onRetry}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Regenerate Answer
                </button>
                <button
                  onClick={() => handleSourceClick(`https://www.google.com/search?q=${encodeURIComponent(query.query)}`)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                >
                  View Original Results
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {!response && !isLoading && (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">Failed to generate AI response</p>
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};