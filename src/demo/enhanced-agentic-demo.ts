import { AgenticMemorySystem } from "../lib/agentic-memory";
import { AgenticPlanner } from "../lib/agentic-planner";
import type { Tool } from "../types/agent";

// Enhanced Agentic Demo - JP Morgan Job Search Example
export class EnhancedAgenticDemo {
	private planner: AgenticPlanner;
	private memory: AgenticMemorySystem;

	constructor() {
		// Initialize with enhanced tools
		const tools: Tool[] = [
			{
				name: "searchGoogle",
				description: "Search Google for information",
				parameters: {
					type: "object",
					properties: {
						query: { type: "string", description: "Search query" },
					},
					required: ["query"],
				},
			},
			{
				name: "clickElement",
				description: "Click on web elements",
				parameters: {
					type: "object",
					properties: {
						selector: { type: "string", description: "CSS selector" },
					},
					required: ["selector"],
				},
			},
			{
				name: "fillInput",
				description: "Fill input fields",
				parameters: {
					type: "object",
					properties: {
						selector: { type: "string", description: "CSS selector" },
						value: { type: "string", description: "Value to fill" },
					},
					required: ["selector", "value"],
				},
			},
			{
				name: "getPageContent",
				description: "Get current page content",
				parameters: {
					type: "object",
					properties: {},
					required: [],
				},
			},
			{
				name: "getCurrentTab",
				description: "Get current tab information",
				parameters: {
					type: "object",
					properties: {},
					required: [],
				},
			},
			{
				name: "waitForElement",
				description: "Wait for element to appear",
				parameters: {
					type: "object",
					properties: {
						selector: { type: "string", description: "CSS selector" },
					},
					required: ["selector"],
				},
			},
			{
				name: "scrollToElement",
				description: "Scroll to specific element",
				parameters: {
					type: "object",
					properties: {
						selector: { type: "string", description: "CSS selector" },
					},
					required: ["selector"],
				},
			},
			{
				name: "navigateToUrl",
				description: "Navigate to URL",
				parameters: {
					type: "object",
					properties: {
						url: { type: "string", description: "URL to navigate to" },
					},
					required: ["url"],
				},
			},
		];

		this.planner = new AgenticPlanner(tools);
		this.memory = new AgenticMemorySystem();
	}

	async demonstrateEnhancedAgenticCapabilities(): Promise<void> {
		console.log("🚀 Enhanced Agentic AI Demo - JP Morgan Job Search");
		console.log("=".repeat(60));

		// Example 1: Basic goal with web context
		await this.demoBasicGoalWithWebContext();

		// Example 2: Learning from execution
		await this.demoLearningFromExecution();

		// Example 3: Adaptive planning based on context
		await this.demoAdaptivePlanning();

		// Example 4: Web-specific intelligence
		await this.demoWebSpecificIntelligence();
	}

	private async demoBasicGoalWithWebContext(): Promise<void> {
		console.log("\n📋 Demo 1: Enhanced Goal Creation with Web Context");
		console.log("-".repeat(50));

		const objective =
			"search jp morgan, go to career page, find software engineer job for india location";

		// Simulate web context (as if user is currently on Google)
		const webContext = {
			url: "https://www.google.com",
			title: "Google",
			content: "Google search page content...",
		};

		const goal = await this.planner.createGoal(objective, { webContext });

		console.log(`✅ Goal Created: ${goal.objective}`);
		console.log(`📊 Priority: ${goal.priority}`);
		console.log(`🎯 Status: ${goal.status}`);
		console.log(`📝 Sub-tasks: ${goal.subTasks.length}`);

		goal.subTasks.forEach((task, index) => {
			console.log(`   ${index + 1}. ${task.description}`);
			console.log(`      Tools: ${task.toolCalls.join(", ")}`);
			if (task.metadata) {
				console.log(
					`      Intent: ${task.metadata.intent}, Confidence: ${task.metadata.confidence}`,
				);
			}
		});
	}

	private async demoLearningFromExecution(): Promise<void> {
		console.log("\n🧠 Demo 2: Learning from Task Execution");
		console.log("-".repeat(50));

		// Simulate successful task execution
		const domain = "jpmorganchase.com";
		const action = "Navigate to careers section";
		const context = "JP Morgan main page with careers link";

		this.memory.addWebContextMemory(domain, action, context, true);

		// Simulate failed task execution
		const failedAction = "Fill location filter with invalid data";
		const error = "Location field not found or invalid selector";

		this.memory.addWebContextMemory(
			domain,
			failedAction,
			context,
			false,
			error,
		);

		// Retrieve learned patterns
		const webMemory = this.memory.getWebContextMemory(domain);
		if (webMemory) {
			console.log(`✅ Learned patterns for ${domain}:`);
			console.log(
				`   Successful actions: ${webMemory.successfulActions.length}`,
			);
			console.log(`   Failure patterns: ${webMemory.failurePatterns.length}`);
			console.log(
				`   Extracted patterns: ${webMemory.patterns.slice(0, 5).join(", ")}`,
			);
		}

		// Get successful actions for future reference
		const successfulActions = this.memory.getSuccessfulActionsForDomain(
			domain,
			"navigate",
		);
		console.log(
			`🎯 Successful navigation actions: ${successfulActions.length}`,
		);
	}

	private async demoAdaptivePlanning(): Promise<void> {
		console.log("\n🔄 Demo 3: Adaptive Planning Based on Context");
		console.log("-".repeat(50));

		const objective = "find software engineer jobs in india";

		// Simulate being on JP Morgan careers page
		const jpMorganContext = {
			url: "https://careers.jpmorganchase.com/us/en/jobs",
			title: "Careers at JPMorgan Chase",
			content: "Job search interface with location and job type filters...",
		};

		// Adapt planning to web context
		this.planner.adaptPlanningToWebContext(jpMorganContext);

		// Get adaptive suggestions
		const suggestions = this.planner.getAdaptiveTaskSuggestions(objective, {
			webContext: jpMorganContext,
			previousResults: [],
			failureHistory: [],
		});

		console.log(`🎯 Adaptive suggestions for JP Morgan careers page:`);
		suggestions.forEach((suggestion, index) => {
			console.log(
				`   ${index + 1}. ${suggestion.description} (confidence: ${suggestion.confidence})`,
			);
			console.log(`      Recommended tools: ${suggestion.tools.join(", ")}`);
		});
	}

	private async demoWebSpecificIntelligence(): Promise<void> {
		console.log("\n🌐 Demo 4: Web-Specific Intelligence");
		console.log("-".repeat(50));

		const objectives = [
			"search jp morgan careers",
			"find software engineer job for india location",
			"apply filters for remote work",
		];

		for (const objective of objectives) {
			console.log(`\n🎯 Analyzing: "${objective}"`);

			// Simulate different web contexts
			const contexts = [
				{ url: "https://www.google.com", title: "Google" },
				{
					url: "https://careers.jpmorganchase.com",
					title: "JP Morgan Careers",
				},
				{ url: "https://www.linkedin.com/jobs", title: "LinkedIn Jobs" },
			];

			for (const webContext of contexts) {
				const goal = await this.planner.createGoal(objective, { webContext });

				console.log(`   📍 On ${webContext.title}:`);
				console.log(`      Generated ${goal.subTasks.length} tasks`);

				const webAwareTasks = goal.subTasks.filter(
					(task) => task.metadata && task.metadata.webAware,
				);
				console.log(`      Web-aware tasks: ${webAwareTasks.length}`);

				if (webAwareTasks.length > 0) {
					const highConfidenceTasks = webAwareTasks.filter(
						(task) =>
							task.metadata &&
							typeof task.metadata.confidence === "number" &&
							task.metadata.confidence > 0.8,
					);
					console.log(
						`      High-confidence tasks: ${highConfidenceTasks.length}`,
					);
				}
			}
		}
	}

	// Method to simulate real agentic execution
	async simulateAgenticExecution(objective: string): Promise<void> {
		console.log(`\n🤖 Simulating Agentic Execution: "${objective}"`);
		console.log("=".repeat(60));

		// Simulate web context
		const webContext = {
			url: "https://www.google.com",
			title: "Google",
			content: "Google search homepage",
		};

		try {
			console.log("🎯 Goal creation and task decomposition...");
			const goal = await this.planner.createGoal(objective, { webContext });

			console.log(`✅ Created goal with ${goal.subTasks.length} tasks:`);
			goal.subTasks.forEach((task, index) => {
				console.log(`   ${index + 1}. ${task.description}`);
				console.log(`      Status: ${task.status}`);
				console.log(`      Tools: ${task.toolCalls.join(", ")}`);
				if (task.metadata) {
					console.log(
						`      Metadata: Intent=${task.metadata.intent}, Confidence=${task.metadata.confidence}`,
					);
				}
			});

			// Simulate task execution progress
			console.log("\n🔄 Simulating task execution...");
			for (let i = 0; i < goal.subTasks.length; i++) {
				const task = goal.subTasks[i];
				console.log(`   Executing: ${task.description}`);

				// Simulate task completion
				setTimeout(
					() => {
						this.planner.updateTaskStatus(task.id, "completed", {
							intent: task.metadata?.intent,
							entities: task.metadata?.entities || [],
							result: `Simulated successful execution of ${task.description}`,
						});
					},
					100 * (i + 1),
				);
			}

			console.log("✅ Agentic execution simulation completed!");
		} catch (error) {
			console.error("❌ Error during agentic execution:", error);
		}
	}
}

// Export demo function for easy testing
export async function runEnhancedAgenticDemo(): Promise<void> {
	const demo = new EnhancedAgenticDemo();

	await demo.demonstrateEnhancedAgenticCapabilities();

	// Run the JP Morgan job search simulation
	await demo.simulateAgenticExecution(
		"search jp morgan, go to career page, find software engineer job for india location",
	);
}

// Auto-run demo if this file is executed directly
if (typeof window === "undefined" && require.main === module) {
	runEnhancedAgenticDemo().catch(console.error);
}
