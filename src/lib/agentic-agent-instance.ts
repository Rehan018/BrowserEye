import { AgenticAgent } from "./agentic-agent";
import { browserHandlers } from "./browser-handlers";
import { browserTools } from "./browser-tools";
import { AGENTIC_SYSTEM_PROMPT } from "./system-prompts";

// Create agentic agent instance with all browser tools
export const agenticAgent = new AgenticAgent({
	systemPrompt: AGENTIC_SYSTEM_PROMPT,
	maxIterations: 15, // Increased for autonomous mode
	tools: Object.values(browserTools),
	toolHandlers: browserHandlers,
});

// Configure autonomous mode settings
agenticAgent.setAutonomousMode(false, 10); // Disabled by default, max 10 actions
