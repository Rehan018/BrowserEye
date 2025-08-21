import { useState, useEffect } from 'react';
import { Brain, Clock, TrendingUp, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { PageAnalyzer, type PageAnalysis } from '../../lib/intelligence/page-analyzer';
import { RelatedContentFinder, type RelatedLink } from '../../lib/intelligence/related-content';
import { FactChecker, type FactCheck } from '../../lib/intelligence/fact-checker';
import { useAppSettings } from '../../contexts/AppSettingsContext';

interface PageInsightsProps {
  content: string;
  url: string;
}

export const PageInsights = ({ content, url }: PageInsightsProps) => {
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null);
  const [relatedContent, setRelatedContent] = useState<RelatedLink[]>([]);
  const [factChecks, setFactChecks] = useState<FactCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'related' | 'facts'>('analysis');
  
  const { settings } = useAppSettings();

  useEffect(() => {
    if (content && url && settings) {
      analyzeContent();
    }
  }, [content, url, settings]);

  const analyzeContent = async () => {
    if (!settings) return;
    
    setLoading(true);
    try {
      const llmOptions = {
        provider: settings.selectedProvider,
        model: settings.model,
        apiKey: settings.apiKeys[settings.selectedProvider],
        customUrl: settings.customUrls?.[settings.selectedProvider],
      };

      const analyzer = new PageAnalyzer();
      const relatedFinder = new RelatedContentFinder();
      const factChecker = new FactChecker();

      const [pageAnalysis, related, facts] = await Promise.all([
        analyzer.analyzePage(content, url, llmOptions),
        relatedFinder.findRelatedContent(content, url, llmOptions),
        factChecker.checkFacts(content, llmOptions)
      ]);

      setAnalysis(pageAnalysis);
      setRelatedContent(related);
      setFactChecks(facts);
    } catch (error) {
      console.error('Page analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };



  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'true': return 'text-green-600';
      case 'false': return 'text-red-600';
      case 'misleading': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Analyzing page content...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Page Insights</h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'analysis', label: 'Analysis', icon: TrendingUp },
          { id: 'related', label: 'Related', icon: ExternalLink },
          { id: 'facts', label: 'Facts', icon: CheckCircle }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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

      {/* Analysis Tab */}
      {activeTab === 'analysis' && analysis && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
            <p className="text-blue-800 text-sm">{analysis.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Reading Time</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{analysis.readingTime} min</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">Sentiment</span>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(analysis.sentiment)}`}>
                {analysis.sentiment}
              </span>
            </div>
          </div>

          {analysis.keyPoints.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Points</h4>
              <ul className="space-y-1">
                {analysis.keyPoints.map((point, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.topics.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Topics</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.topics.map((topic, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Content Tab */}
      {activeTab === 'related' && (
        <div className="space-y-3">
          {relatedContent.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No related content found</p>
          ) : (
            relatedContent.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm">{item.title}</h5>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(item.relevance * 100)}% relevant
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(item.url, '_blank')}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Fact Checks Tab */}
      {activeTab === 'facts' && (
        <div className="space-y-3">
          {factChecks.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No fact checks available</p>
          ) : (
            factChecks.map((fact, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded ${getVerdictColor(fact.verdict)}`}>
                    {fact.verdict === 'true' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{fact.claim}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${getVerdictColor(fact.verdict)}`}>
                        {fact.verdict.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(fact.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{fact.explanation}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};