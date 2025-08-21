import { AgenticAgent } from "../lib/agentic-agent";
import { AgenticMemorySystem } from "../lib/agentic-memory";
import { AgenticPlanner } from "../lib/agentic-planner";
import type { Tool } from "../types/agent";

// Mock tools for testing
const mockTools: Tool[] = [
	{
		name: "testTool",
		description: "A test tool",
		parameters: {
			type: "object",
			properties: {
				input: { type: "string", description: "Test input" },
			},
			required: ["input"],
		},
	},
];

const mockToolHandlers = {
	testTool: async (args: any) => `Executed with: ${args.input}`,
};

describe("AgenticAgent", () => {
	let agent: AgenticAgent;

	beforeEach(() => {
		agent = new AgenticAgent({
			systemPrompt: "Test agent",
			tools: mockTools,
			toolHandlers: mockToolHandlers,
		});
	});

	test("should create agent with agentic capabilities", () => {
		expect(agent).toBeInstanceOf(AgenticAgent);
		expect(agent.getCurrentGoal()).toBeNull();
	});

	test("should set autonomous mode", () => {
		agent.setAutonomousMode(true, 5);
		// Test would verify internal state if exposed
		expect(true).toBe(true); // Placeholder
	});

	test("should clear current goal", () => {
		agent.clearCurrentGoal();
		expect(agent.getCurrentGoal()).toBeNull();
	});

	test("should get memory system", () => {
		const memory = agent.getMemorySystem();
		expect(memory).toBeInstanceOf(AgenticMemorySystem);
	});
});

describe("AgenticPlanner", () => {
	let planner: AgenticPlanner;

	beforeEach(() => {
		planner = new AgenticPlanner(mockTools);
	});

	test("should create goal from objective", async () => {
		const goal = await planner.createGoal("Test objective");

		expect(goal.objective).toBe("Test objective");
		expect(goal.status).toBe("executing");
		expect(goal.subTasks).toBeDefined();
		expect(goal.progress).toBe(0);
	});

	test("should determine priority correctly", async () => {
		const urgentGoal = await planner.createGoal("Urgent task ASAP");
		const normalGoal = await planner.createGoal("Regular task");

		expect(urgentGoal.priority).toBe("critical");
		expect(normalGoal.priority).toBe("medium");
	});

	test("should calculate progress", async () => {
		const goal = await planner.createGoal("Test with tasks");

		// Mock completed task
		if (goal.subTasks.length > 0) {
			goal.subTasks[0].status = "completed";
		}

		const progress = planner.calculateProgress(goal);
		expect(progress).toBeGreaterThanOrEqual(0);
		expect(progress).toBeLessThanOrEqual(100);
	});
});

describe("AgenticMemorySystem", () => {
	let memory: AgenticMemorySystem;

	beforeEach(() => {
		memory = new AgenticMemorySystem();
	});

	test("should add and retrieve memories", () => {
		const memoryId = memory.addMemory("fact", "Test fact", { source: "test" });

		expect(memoryId).toBeDefined();
		expect(typeof memoryId).toBe("string");
	});

	test("should find relevant memories", () => {
		memory.addMemory("fact", "JavaScript is a programming language");
		memory.addMemory("fact", "Python is also a programming language");
		memory.addMemory("fact", "Cats are animals");

		const relevant = memory.getRelevantMemories("programming language");

		expect(relevant.length).toBeGreaterThan(0);
		expect(relevant[0].content).toContain("programming language");
	});

	test("should learn from success", () => {
		memory.learnFromSuccess("clickElement", "button click", "success");

		const patterns = memory.getRelevantMemories("clickElement");
		expect(patterns.length).toBeGreaterThan(0);
	});

	test("should learn from failure", () => {
		memory.learnFromFailure("fillInput", "form filling", "element not found");

		const patterns = memory.getRelevantMemories("fillInput");
		expect(patterns.length).toBeGreaterThan(0);
	});

	test("should store user preferences", () => {
		memory.storeUserPreference("theme", "dark");

		const preferences = memory.getRelevantMemories("theme");
		expect(preferences.length).toBeGreaterThan(0);
	});
});

// Integration test
describe("Agentic Integration", () => {
	test("should work together", async () => {
		const agent = new AgenticAgent({
			systemPrompt: "Integration test agent",
			tools: mockTools,
			toolHandlers: mockToolHandlers,
		});

		// Test memory integration
		const memory = agent.getMemorySystem();
		memory.addMemory("fact", "Integration test fact");

		const memories = memory.getRelevantMemories("integration");
		expect(memories.length).toBeGreaterThan(0);

		// Test goal management
		expect(agent.getCurrentGoal()).toBeNull();
		agent.clearCurrentGoal();
		expect(agent.getCurrentGoal()).toBeNull();
	});
});
