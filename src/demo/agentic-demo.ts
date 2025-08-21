import { agenticAgent } from "../lib/agentic-agent-instance";
import type { AgentMessage } from "../types/agent";

/**
 * Demo script to showcase agentic AI capabilities
 * Run this to test the agentic agent functionality
 */

export async function runAgenticDemo() {
	console.log("🚀 Starting Agentic AI Demo...\n");

	// Demo 1: Simple goal decomposition
	console.log("📋 Demo 1: Goal Decomposition");
	const simpleHistory: AgentMessage[] = [
		{
			id: crypto.randomUUID(),
			role: "user",
			content:
				'Search for "TypeScript tutorials" on Google and summarize the first result',
		},
	];

	try {
		const response1 = await agenticAgent.runAgentic(
			simpleHistory,
			{
				provider: "ollama",
				model: "llama3.2",
				apiKey: "",
				customUrl: "http://localhost:11434",
			},
			undefined,
			false, // Not autonomous
		);

		console.log("Goal created:", response1.currentGoal?.objective);
		console.log("Tasks:", response1.currentGoal?.subTasks.length);
		console.log("Status:", response1.currentGoal?.status);
		console.log("Progress:", response1.currentGoal?.progress + "%\n");
	} catch (error) {
		console.error("Demo 1 failed:", error);
	}

	// Demo 2: Autonomous mode
	console.log("🤖 Demo 2: Autonomous Mode");
	agenticAgent.setAutonomousMode(true, 5);

	const autonomousHistory: AgentMessage[] = [
		{
			id: crypto.randomUUID(),
			role: "user",
			content:
				"Check my Gmail for new emails and tell me about any important ones",
		},
	];

	try {
		const response2 = await agenticAgent.runAgentic(
			autonomousHistory,
			{
				provider: "ollama",
				model: "llama3.2",
				apiKey: "",
				customUrl: "http://localhost:11434",
			},
			undefined,
			true, // Autonomous mode
		);

		console.log("Autonomous execution completed");
		console.log("Iterations:", response2.iterations);
		console.log("Autonomous mode:", response2.autonomousMode);
		console.log("Final status:", response2.currentGoal?.status);
		console.log("Next action:", response2.nextAction || "None\n");
	} catch (error) {
		console.error("Demo 2 failed:", error);
	}

	// Demo 3: Memory and learning
	console.log("🧠 Demo 3: Memory and Learning");
	const memory = agenticAgent.getMemorySystem();

	// Add some test memories
	memory.addMemory("preference", "User prefers dark theme");
	memory.addMemory("fact", "User works with TypeScript projects");
	memory.addMemory("pattern", "User often searches for tutorials");

	// Test memory retrieval
	const relevantMemories = memory.getRelevantMemories("TypeScript tutorials");
	console.log("Relevant memories found:", relevantMemories.length);
	relevantMemories.forEach((mem, i) => {
		console.log(`  ${i + 1}. ${mem.content} (${mem.type})`);
	});

	// Test learning
	memory.learnFromSuccess(
		"searchGoogle",
		"tutorial search",
		"found relevant results",
	);
	memory.learnFromFailure("clickElement", "button click", "element not found");

	console.log("\n✅ Agentic AI Demo completed!");
}

/**
 * Interactive demo for testing specific scenarios
 */
export async function runInteractiveDemo(scenario: string) {
	console.log(`🎯 Running scenario: ${scenario}\n`);

	const scenarios = {
		"email-check": {
			message: "Open Gmail and check for new emails from my boss",
			autonomous: true,
		},
		"research-task": {
			message: "Research the latest AI developments and create a summary",
			autonomous: false,
		},
		"form-filling": {
			message: "Fill out the contact form on example.com with my details",
			autonomous: true,
		},
		shopping: {
			message:
				"Find the best price for iPhone 15 Pro across different websites",
			autonomous: true,
		},
	};

	const config = scenarios[scenario as keyof typeof scenarios];
	if (!config) {
		console.error("Unknown scenario:", scenario);
		return;
	}

	const history: AgentMessage[] = [
		{
			id: crypto.randomUUID(),
			role: "user",
			content: config.message,
		},
	];

	agenticAgent.setAutonomousMode(config.autonomous, 8);

	try {
		const response = await agenticAgent.runAgentic(
			history,
			{
				provider: "ollama",
				model: "llama3.2",
				apiKey: "",
				customUrl: "http://localhost:11434",
			},
			undefined,
			config.autonomous,
		);

		console.log("Scenario Results:");
		console.log("- Goal:", response.currentGoal?.objective);
		console.log("- Status:", response.currentGoal?.status);
		console.log("- Progress:", response.currentGoal?.progress + "%");
		console.log(
			"- Tasks completed:",
			response.currentGoal?.subTasks.filter((t) => t.status === "completed")
				.length,
		);
		console.log("- Autonomous mode:", response.autonomousMode);
		console.log("- Iterations:", response.iterations);

		if (response.toolCalls && response.toolCalls.length > 0) {
			console.log(
				"- Tools used:",
				response.toolCalls.map((tc) => tc.name).join(", "),
			);
		}
	} catch (error) {
		console.error("Scenario failed:", error);
	}
}

// Export for use in browser console or testing
if (typeof window !== "undefined") {
	(window as any).agenticDemo = {
		runDemo: runAgenticDemo,
		runScenario: runInteractiveDemo,
		agent: agenticAgent,
	};
}
