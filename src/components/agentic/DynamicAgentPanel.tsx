import { useState, useEffect } from "react";
import { Brain, Target } from "lucide-react";
import { DynamicAgent } from "../../lib/agentic/dynamic-agent";
import type { ExecutionResult } from "../../lib/agentic/dynamic-agent";
import { PageInsights } from "../intelligence/PageInsights";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useTabContext } from "../../contexts/TabContext";
import { agenticAgent } from "../../lib/agentic-agent-instance";

interface DynamicAgentPanelProps {
  onGoalUpdate?: (goal: string) => void;
}

export const DynamicAgentPanel = ({ onGoalUpdate }: DynamicAgentPanelProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [pageContent, setPageContent] = useState('');

  const { settings } = useAppSettings();
  const { contextUrl, contextTitle } = useTabContext();
  
  const agent = new DynamicAgent();

  useEffect(() => {
    // Get page content for analysis
    if (contextUrl) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'GET_PAGE_CONTENT_FOR_ANALYSIS'
          });
        }
      });
    }

    // Listen for page content
    const handleMessage = (message: any) => {
      if (message.type === 'PAGE_CONTENT_EXTRACTED') {
        setPageContent(message.data.content);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [contextUrl]);

  const handleUserRequest = async (request: string) => {
    if (!settings || !request.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const context = {
        url: contextUrl,
        title: contextTitle,
        timestamp: new Date().toISOString()
      };
      
      const llmOptions = {
        provider: settings.selectedProvider,
        model: settings.model,
        apiKey: settings.apiKeys[settings.selectedProvider],
        customUrl: settings.customUrls?.[settings.selectedProvider],
      };
      
      // Update current goal
      if (onGoalUpdate) {
        onGoalUpdate(request);
      } else {
        // Fallback: update agentic agent goal
        agenticAgent.setCurrentGoal({
          id: crypto.randomUUID(),
          objective: request,
          priority: 'medium',
          progress: 0,
          status: 'executing',
          createdAt: new Date(),
          subTasks: []
        });
      }
      
      const executionResult = await agent.processUserRequest(request, context, llmOptions);
      setResult(executionResult);
      

      
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextActions: ["Try again with a different request"]
      });
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Dynamic AI Agent</h3>

      </div>



      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleUserRequest("What can you do on this page?")}
          disabled={isProcessing}
          className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-left"
        >
          <Target className="w-4 h-4 mb-1" />
          Analyze Page
        </button>
        <button
          onClick={() => handleUserRequest("Help me with email")}
          disabled={isProcessing}
          className="p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-left"
        >
          📧 Email Help
        </button>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
          <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
          <span className="text-sm text-yellow-800">Processing your request...</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
              {result.success ? 'Success' : 'Failed'}
            </span>
          </div>
          
          <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.message}
          </p>
          
          {result.nextActions && result.nextActions.length > 0 && (
            <div className="mt-2">
              <span className="text-xs font-medium text-gray-600">Suggestions:</span>
              <ul className="text-xs text-gray-600 mt-1 space-y-1">
                {result.nextActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Page Intelligence */}
      {contextUrl && pageContent && (
        <PageInsights 
          content={pageContent} 
          url={contextUrl} 
        />
      )}

    </div>
  );
};