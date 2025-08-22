import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react';
import type { SynthesizedAnswer } from '../../lib/search-interception/answer-synthesizer';

interface SearchOverlayProps {
  answer: SynthesizedAnswer;
  query: string;
  onToggleOriginal: () => void;
  showOriginal: boolean;
  isLoading?: boolean;
}

export const SearchOverlay = ({ 
  answer, 
  query, 
  onToggleOriginal, 
  showOriginal,
  isLoading = false 
}: SearchOverlayProps) => {
  const [showCitations, setShowCitations] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg p-6 mb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-700">Generating AI answer for "{query}"...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <span className="font-semibold text-gray-900">AI Answer</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {answer.confidence}% confidence
          </span>
        </div>
        
        <button
          onClick={onToggleOriginal}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {showOriginal ? 'Hide' : 'Show'} original results
          {showOriginal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Answer */}
      <div className="prose prose-sm max-w-none mb-4">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {answer.answer}
        </p>
      </div>

      {/* Citations Toggle */}
      {answer.citations.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            Sources ({answer.citations.length})
            {showCitations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showCitations && (
            <div className="mt-3 space-y-2">
              {answer.citations.map(citation => (
                <div key={citation.id} className="bg-white p-3 rounded border text-sm">
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                      {citation.id}
                    </span>
                    <div className="flex-1">
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        {citation.title}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <p className="text-gray-600 mt-1">{citation.snippet}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Follow-up Questions */}
      {answer.followUpQuestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Related questions:</h4>
          <div className="flex flex-wrap gap-2">
            {answer.followUpQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  // Trigger new search
                  window.location.href = `https://www.google.com/search?q=${encodeURIComponent(question)}`;
                }}
                className="text-sm bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};