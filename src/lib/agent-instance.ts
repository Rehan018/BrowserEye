import { Agent } from './agent';
import { browserTools } from './browser-tools';
import { browserHandlers } from './browser-handlers';
import type { AppSettings } from '../types';

let agentInstance: Agent | null = null;

export function createAgentInstance(_settings: AppSettings): Agent {
  agentInstance = new Agent({
    tools: Object.values(browserTools),
    toolHandlers: browserHandlers,
    systemPrompt: "You are BrowserEye, an AI-powered browser automation assistant.",
    maxIterations: 10,
  });
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

// Export agent instance for backward compatibility
export const agent = {
  createInstance: createAgentInstance,
  getInstance: getAgentInstance,
  destroy: destroyAgentInstance,
};