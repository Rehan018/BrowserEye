import type { Tool } from "../types/agent";
import type { AgenticGoal, AgenticTask } from "../types/agentic";

interface WebContext {
	url?: string;
	title?: string;
	content?: string;
	elements?: Array<{
		tag: string;
		text: string;
		attributes: Record<string, string>;
	}>;
}

interface TaskExecutionContext {
	webContext?: WebContext;
	previousResults?: unknown[];
	failureHistory?: Array<{ task: string; error: string; attempt: number }>;
}

export class AgenticPlanner {
	private tools: Tool[];
	private webPatterns: Map<string, string[]> = new Map();
	private successPatterns: Map<string, number> = new Map();

	constructor(tools: Tool[]) {
		this.tools = tools;
		this.initializeWebPatterns();
	}

	private initializeWebPatterns(): void {
		// Common web navigation patterns
		this.webPatterns.set("job_search", [
			"careers",
			"jobs",
			"opportunities",
			"positions",
			"employment",
			"work-with-us",
		]);
		this.webPatterns.set("company_search", [
			"about",
			"company",
			"organization",
			"who-we-are",
			"our-company",
		]);
		this.webPatterns.set("location_filter", [
			"location",
			"country",
			"city",
			"region",
			"office",
			"remote",
		]);
		this.webPatterns.set("job_type_filter", [
			"software",
			"engineer",
			"developer",
			"programmer",
			"technical",
			"technology",
		]);
	}

	async createGoal(
		objective: string,
		context?: Record<string, unknown>,
	): Promise<AgenticGoal> {
		const goal: AgenticGoal = {
			id: crypto.randomUUID(),
			objective,
			priority: this.determinePriority(objective),
			status: "planning",
			subTasks: [],
			progress: 0,
			createdAt: new Date(),
			context,
		};

		// Enhanced decomposition with web context
		const executionContext: TaskExecutionContext = {
			webContext: context?.webContext as WebContext,
			previousResults: [],
			failureHistory: [],
		};

		goal.subTasks = await this.decomposeWithContext(
			objective,
			goal.id,
			executionContext,
		);
		goal.status = "executing";

		return goal;
	}

	private determinePriority(
		objective: string,
	): "low" | "medium" | "high" | "critical" {
		const urgentKeywords = [
			"urgent",
			"asap",
			"immediately",
			"critical",
			"emergency",
		];
		const highKeywords = ["important", "priority", "deadline", "meeting"];

		const lowerObj = objective.toLowerCase();

		if (urgentKeywords.some((keyword) => lowerObj.includes(keyword)))
			return "critical";
		if (highKeywords.some((keyword) => lowerObj.includes(keyword)))
			return "high";
		if (lowerObj.includes("later") || lowerObj.includes("when possible"))
			return "low";

		return "medium";
	}

	private async decomposeWithContext(
		objective: string,
		goalId: string,
		context: TaskExecutionContext,
	): Promise<AgenticTask[]> {
		const analysis = this.analyzeObjectiveWithContext(objective, context);
		const tasks: AgenticTask[] = [];

		// Convert analyzed actions into executable tasks with dynamic tool selection
		for (const action of analysis.actions) {
			const dynamicTools = this.selectDynamicTools(action, context);
			tasks.push(
				this.createEnhancedTask(
					goalId,
					action.description,
					dynamicTools,
					action,
				),
			);
		}

		// Add conditional tasks based on web context
		if (context.webContext?.url) {
			tasks.unshift(this.createContextAnalysisTask(goalId, context.webContext));
		}

		return tasks;
	}

	// Method removed - replaced with createEnhancedTask

	private analyzeObjectiveWithContext(
		objective: string,
		context: TaskExecutionContext,
	): {
		actions: Array<{
			type: string;
			description: string;
			tools: string[];
			intent: string;
			entities: string[];
			confidence: number;
			webAware: boolean;
		}>;
	} {
		// Enhanced dynamic analysis with web context awareness
		const sentences = this.splitIntoActionableUnits(objective);
		const actions: Array<{
			type: string;
			description: string;
			tools: string[];
			intent: string;
			entities: string[];
			confidence: number;
			webAware: boolean;
		}> = [];

		for (const sentence of sentences) {
			const analysis = this.analyzeIntentWithContext(sentence, context);
			if (analysis.intent !== "unknown") {
				actions.push({
					type: analysis.intent,
					description: this.generateDescription(analysis),
					tools: this.selectToolsForIntent(analysis.intent, analysis.entities),
					intent: analysis.intent,
					entities: analysis.entities,
					confidence: analysis.confidence,
					webAware: this.isWebAwareIntent(analysis.intent),
				});
			}
		}

		// Enhanced fallback with web context
		if (actions.length === 0) {
			const webAwareAction = this.createWebAwareExploratoryAction(
				objective,
				context,
			);
			actions.push(webAwareAction as any);
		}

		// Add web-specific actions based on context
		if (context.webContext?.url) {
			const webActions = this.generateWebSpecificActions(
				objective,
				context.webContext,
			);
			actions.push(...(webActions as any[]));
		}

		return { actions };
	}

	private splitIntoActionableUnits(objective: string): string[] {
		// Improved splitting to avoid word duplication
		// Split by commas, semicolons, and explicit connectors while preserving context
		const parts = objective
			.split(
				/,\s*|;\s*|\s+then\s+|\s+and\s+(?=(?:go|navigate|find|search|filter)\s+)/i,
			)
			.map((s) => s.trim())
			.filter((s) => s.length > 3); // Filter out very short fragments

		// If no clear splits found, return the whole objective as one unit
		return parts.length > 0 ? parts : [objective];
	}

	private analyzeIntentWithContext(
		text: string,
		context: TaskExecutionContext,
	): { intent: string; entities: string[]; confidence: number } {
		if (!text || typeof text !== "string") {
			return { intent: "unknown", entities: [], confidence: 0 };
		}

		const lowerText = text.toLowerCase();
		const entities = this.extractEntities(text);

		// Enhanced context-aware intent detection
		let intent = "unknown";
		let confidence = 0;

		// Web context influences intent detection
		const webContext = context.webContext;
		const isOnJobSite =
			webContext?.url?.includes("career") ||
			webContext?.title?.toLowerCase().includes("job");

		// Enhanced pattern matching with web awareness
		if (
			/\b(search|find)\s+\w+/.test(lowerText) &&
			!/(go to|navigate)/.test(lowerText)
		) {
			intent = isOnJobSite ? "job_search" : "search";
			confidence = isOnJobSite ? 0.95 : 0.9;
		} else if (/\b(go to|navigate to|visit)\s+\w+/.test(lowerText)) {
			intent = "navigation";
			confidence = 0.9;
		} else if (
			/\b(find|search for).*\b(job|position|role)\b.*\b(location|in|at)\b/.test(
				lowerText,
			)
		) {
			intent = "job_filtering";
			confidence = 0.9;
		} else if (/\b(click|select|choose|play)\b/.test(lowerText)) {
			intent = "interaction";
			confidence = 0.7;
		} else if (/\b(read|check|analyze|view)\b/.test(lowerText)) {
			intent = "analysis";
			confidence = 0.6;
		} else if (/\b(career|job)\s+(page|section)\b/.test(lowerText)) {
			intent = "career_navigation";
			confidence = 0.85;
		}

		// Boost confidence based on success patterns
		const patternKey = `${intent}_${entities.join("_")}`;
		if (this.successPatterns.has(patternKey)) {
			confidence = Math.min(1.0, confidence + 0.1);
		}

		return { intent, entities, confidence };
	}

	private extractEntities(text: string): string[] {
		if (!text || typeof text !== "string") {
			return [];
		}

		const words = text
			.split(/\s+/)
			.map((w) => w.replace(/[^\w\s]/g, "").trim())
			.filter((w) => w.length > 0);
		const entities: string[] = [];
		const usedWords = new Set<string>();

		// Extract key entities without duplication
		// Look for company names, job titles, locations
		const companyPattern =
			/\b(jp\s*morgan|jpmorgan|google|microsoft|amazon|facebook|linkedin|indeed)\b/gi;
		const jobPattern =
			/\b(software\s+engineer|developer|programmer|engineer|analyst)\b/gi;
		const locationPattern =
			/\b(india|bangalore|mumbai|delhi|hyderabad|remote)\b/gi;

		// Extract company names
		const companies = text.match(companyPattern);
		if (companies) {
			companies.forEach((company) => {
				const cleanCompany = company.trim().toLowerCase().replace(/\s+/g, " ");
				if (!usedWords.has(cleanCompany)) {
					entities.push(company.trim());
					usedWords.add(cleanCompany);
				}
			});
		}

		// Extract job titles
		const jobs = text.match(jobPattern);
		if (jobs) {
			jobs.forEach((job) => {
				const cleanJob = job.trim().toLowerCase();
				if (!usedWords.has(cleanJob)) {
					entities.push(job.trim());
					usedWords.add(cleanJob);
				}
			});
		}

		// Extract locations
		const locations = text.match(locationPattern);
		if (locations) {
			locations.forEach((location) => {
				const cleanLocation = location.trim().toLowerCase();
				if (!usedWords.has(cleanLocation)) {
					entities.push(location.trim());
					usedWords.add(cleanLocation);
				}
			});
		}

		// If no specific entities found, extract key nouns (but avoid duplication)
		if (entities.length === 0) {
			words.forEach((word) => {
				const cleanWord = word.toLowerCase();
				if (
					word.length > 3 &&
					!this.isStopWord(cleanWord) &&
					!usedWords.has(cleanWord)
				) {
					entities.push(word);
					usedWords.add(cleanWord);
				}
			});
		}

		return entities.slice(0, 5); // Limit to 5 entities to prevent overly long descriptions
	}

	private isStopWord(word: string): boolean {
		const stopWords = [
			"the",
			"and",
			"or",
			"but",
			"in",
			"on",
			"at",
			"to",
			"for",
			"of",
			"with",
			"by",
			"this",
			"that",
			"these",
			"those",
			"a",
			"an",
			"is",
			"are",
			"was",
			"were",
			"be",
			"been",
			"have",
			"has",
			"had",
			"do",
			"does",
			"did",
			"will",
			"would",
			"could",
			"should",
			"may",
			"might",
			"can",
			"go",
			"get",
			"find",
			"search",
		];
		return stopWords.includes(word.toLowerCase());
	}

	private generateDescription(analysis: {
		intent: string;
		entities: string[];
	}): string {
		const { intent, entities } = analysis;
		const primaryEntity = entities[0] || "target";

		const templates = {
			navigation: `Navigate to ${primaryEntity}`,
			search: `Search for ${entities.join(" ")}`,
			interaction: `Interact with ${primaryEntity}`,
			filtering: `Filter by ${entities.join(" and ")}`,
			analysis: `Analyze ${primaryEntity}`,
		};

		return (
			templates[intent as keyof typeof templates] ||
			`Execute action on ${primaryEntity}`
		);
	}

	private selectToolsForIntent(intent: string, entities: string[]): string[] {
		// Enhanced dynamic tool selection based on intent and available tools
		const toolMap = {
			navigation: ["navigateToUrl"],
			search: ["fillInput", "clickElement"],
			job_search: ["fillInput", "clickElement", "getPageContent"],
			job_filtering: ["fillInput", "clickElement", "scrollToElement"],
			career_navigation: ["clickElement", "getPageContent"],
			interaction: ["clickElement"],
			filtering: ["fillInput", "clickElement"],
			analysis: ["getPageContent"],
			explore: ["getCurrentTab", "getPageContent"],
		};

		const baseTools = toolMap[intent as keyof typeof toolMap] || [
			"clickElement",
		];

		// Add additional tools based on entities
		const additionalTools: string[] = [];
		entities.forEach((entity) => {
			if (entity.toLowerCase().includes("scroll"))
				additionalTools.push("scrollToElement");
			if (entity.toLowerCase().includes("form"))
				additionalTools.push("fillInput");
		});

		return [...new Set([...baseTools, ...additionalTools])];
	}

	private selectDynamicTools(
		action: any,
		context: TaskExecutionContext,
	): string[] {
		const baseTools = this.selectToolsForIntent(action.intent, action.entities);

		// Add context-specific tools
		const dynamicTools = [...baseTools];

		// Use available tools from constructor
		const availableToolNames = this.tools.map((tool) => tool.name);

		// Filter to only available tools and add smart suggestions
		const filteredTools = dynamicTools.filter((tool) =>
			availableToolNames.includes(tool),
		);

		// Add web-specific tools based on context
		if (context.webContext?.url) {
			if (
				availableToolNames.includes("searchGoogle") &&
				action.intent === "search"
			) {
				filteredTools.unshift("searchGoogle");
			}
			if (
				availableToolNames.includes("waitForElement") &&
				action.intent.includes("job")
			) {
				filteredTools.push("waitForElement");
			}
		}

		return [...new Set(filteredTools)];
	}

	private createEnhancedTask(
		goalId: string,
		description: string,
		toolCalls: string[],
		action: any,
	): AgenticTask {
		return {
			id: crypto.randomUUID(),
			goalId,
			description,
			status: "pending",
			toolCalls,
			dependencies: [],
			retryCount: 0,
			maxRetries: action.confidence > 0.8 ? 2 : 3, // Fewer retries for high-confidence tasks
			metadata: {
				intent: action.intent,
				entities: action.entities,
				confidence: action.confidence,
				webAware: action.webAware,
			},
		};
	}

	private createContextAnalysisTask(
		goalId: string,
		webContext: WebContext,
	): AgenticTask {
		return {
			id: crypto.randomUUID(),
			goalId,
			description: `Analyze current page context: ${webContext.title || webContext.url}`,
			status: "pending",
			toolCalls: ["getPageContent", "getCurrentTab"],
			dependencies: [],
			retryCount: 0,
			maxRetries: 2,
			metadata: {
				intent: "context_analysis",
				webContext: webContext,
				priority: "high",
			},
		};
	}

	private isWebAwareIntent(intent: string): boolean {
		const webAwareIntents = [
			"job_search",
			"job_filtering",
			"career_navigation",
			"navigation",
			"search",
			"interaction",
		];
		return webAwareIntents.includes(intent);
	}

	private createWebAwareExploratoryAction(
		objective: string,
		context: TaskExecutionContext,
	): {
		type: string;
		description: string;
		tools: string[];
		intent: string;
		entities: string[];
		confidence: number;
		webAware: boolean;
	} {
		const webContext = context.webContext;

		return {
			type: "web_explore",
			description: webContext?.url
				? `Explore current page (${webContext.title || webContext.url}) to understand: ${objective}`
				: `Analyze and understand the objective: ${objective}`,
			tools: webContext?.url
				? ["getPageContent", "getCurrentTab"]
				: ["getCurrentTab", "getPageContent", "searchGoogle"],
			intent: "web_explore",
			entities: [objective],
			confidence: 0.7,
			webAware: true,
		};
	}

	private generateWebSpecificActions(
		objective: string,
		webContext: WebContext,
	): Array<{
		type: string;
		description: string;
		tools: string[];
		intent: string;
		entities: string[];
		confidence: number;
		webAware: boolean;
	}> {
		const actions: Array<{
			type: string;
			description: string;
			tools: string[];
			intent: string;
			entities: string[];
			confidence: number;
			webAware: boolean;
		}> = [];
		const lowerObjective = objective.toLowerCase();
		const url = webContext.url?.toLowerCase() || "";
		const title = webContext.title?.toLowerCase() || "";

		// Job search specific actions
		if (lowerObjective.includes("job") || lowerObjective.includes("career")) {
			if (!url.includes("career") && !title.includes("job")) {
				actions.push({
					type: "career_navigation",
					description: "Navigate to careers/jobs section",
					tools: ["clickElement", "getPageContent"],
					intent: "career_navigation",
					entities: this.webPatterns.get("job_search") || [],
					confidence: 0.8,
					webAware: true,
				});
			}

			// Location filtering
			if (
				lowerObjective.includes("india") ||
				lowerObjective.includes("location")
			) {
				actions.push({
					type: "location_filter",
					description: "Filter jobs by India location",
					tools: ["fillInput", "clickElement", "waitForElement"],
					intent: "job_filtering",
					entities: ["India", "location"],
					confidence: 0.85,
					webAware: true,
				});
			}

			// Job type filtering
			if (
				lowerObjective.includes("software") ||
				lowerObjective.includes("engineer")
			) {
				actions.push({
					type: "job_type_filter",
					description: "Filter for software engineer positions",
					tools: ["fillInput", "clickElement", "waitForElement"],
					intent: "job_filtering",
					entities: ["software engineer", "developer"],
					confidence: 0.9,
					webAware: true,
				});
			}
		}

		return actions;
	}

	updateTaskStatus(
		taskId: string,
		status: AgenticTask["status"],
		result?: unknown,
		error?: string,
	): void {
		// Enhanced task status update with learning
		console.log(`Task ${taskId} updated to ${status}`, { result, error });

		// Learn from task execution results
		this.learnFromTaskExecution(taskId, status, result, error);
	}

	calculateProgress(goal: AgenticGoal): number {
		if (goal.subTasks.length === 0) return 0;

		const completed = goal.subTasks.filter(
			(task) => task.status === "completed",
		).length;
		return Math.round((completed / goal.subTasks.length) * 100);
	}

	private learnFromTaskExecution(
		_taskId: string,
		status: AgenticTask["status"],
		result?: unknown,
		error?: string,
	): void {
		// Learn from successful patterns
		if (status === "completed" && result) {
			// Increment success pattern for this type of task
			// This would be enhanced with actual task metadata in a real implementation
			if (typeof result === "object" && result !== null) {
				const resultObj = result as Record<string, unknown>;
				if (resultObj.intent && resultObj.entities) {
					const patternKey = `${resultObj.intent}_${(resultObj.entities as string[]).join("_")}`;
					const currentCount = this.successPatterns.get(patternKey) || 0;
					this.successPatterns.set(patternKey, currentCount + 1);
				}
			}
		}

		// Learn from failures for better retry strategies
		if (status === "failed" && error) {
			console.log(`Learning from failure: ${error}`);
			// In a real implementation, this would analyze failure patterns
			// and adjust future task creation strategies
		}
	}

	// Method to adapt planning based on current web context
	adaptPlanningToWebContext(webContext: WebContext): void {
		// Update web patterns based on current context
		if (webContext.url && webContext.title) {
			const domain = new URL(webContext.url).hostname;

			// Learn domain-specific patterns
			if (domain.includes("linkedin")) {
				this.webPatterns.set("linkedin_job_search", [
					"jobs",
					"search",
					"location",
					"experience-level",
				]);
			} else if (domain.includes("indeed")) {
				this.webPatterns.set("indeed_job_search", [
					"job-search",
					"where",
					"salary",
					"job-type",
				]);
			} else if (
				domain.includes("jpmorganchase") ||
				domain.includes("jpmorgan")
			) {
				this.webPatterns.set("jpmorgan_careers", [
					"careers",
					"search-jobs",
					"locations",
					"job-family",
				]);
			}
		}
	}

	// Method to get adaptive task suggestions based on context
	getAdaptiveTaskSuggestions(
		objective: string,
		context: TaskExecutionContext,
	): Array<{ description: string; confidence: number; tools: string[] }> {
		const suggestions: Array<{
			description: string;
			confidence: number;
			tools: string[];
		}> = [];

		const webContext = context.webContext;
		if (!webContext?.url) return suggestions;

		const domain = new URL(webContext.url).hostname.toLowerCase();
		const lowerObjective = objective.toLowerCase();

		// Company-specific suggestions
		if (domain.includes("jpmorganchase") || domain.includes("jpmorgan")) {
			if (lowerObjective.includes("job") || lowerObjective.includes("career")) {
				suggestions.push({
					description: "Use JP Morgan specific job search interface",
					confidence: 0.9,
					tools: ["clickElement", "fillInput", "waitForElement"],
				});

				if (lowerObjective.includes("india")) {
					suggestions.push({
						description:
							"Filter by India office locations (Mumbai, Bangalore, Hyderabad)",
						confidence: 0.85,
						tools: ["fillInput", "clickElement"],
					});
				}
			}
		}

		return suggestions.sort((a, b) => b.confidence - a.confidence);
	}
}
