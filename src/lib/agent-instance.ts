import { Agent } from './agent';
import { getBrowserTools } from './browser-tools';
import type { LLMProvider } from '../types/llm';
import type { AppSettings } from '../types/settings';

let agentInstance: Agent | null = null;

export function createAgentInstance(settings: AppSettings): Agent {
  const tools = getBrowserTools();
  
  const llmConfig: LLMProvider = {
    provider: settings.provider,
    apiKey: settings.apiKey,
    model: settings.model,
    baseUrl: settings.baseUrl,
  };

  agentInstance = new Agent(tools, llmConfig);
  return agentInstance;
}

export function getAgentInstance(): Agent | null {
  return agentInstance;
}

export function destroyAgentInstance(): void {
  if (agentInstance) {
    agentInstance.stop();
    agentInstance = null;
  }
}