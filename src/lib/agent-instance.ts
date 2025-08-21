import { Agent } from "./agent";
import { browserHandlers } from "./browser-handlers";
import { browserTools } from "./browser-tools";
import { BROWSEREYE_SYSTEM_PROMPT } from "./system-prompts";

export const agent = new Agent({
	systemPrompt: BROWSEREYE_SYSTEM_PROMPT,
	maxIterations: 100,
	tools: [...Object.values(browserTools)],
	toolHandlers: {
		...browserHandlers,
	},
});
