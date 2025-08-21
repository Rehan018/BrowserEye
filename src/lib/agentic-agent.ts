import type { UseLLMOptions } from "../types";
import type { AgentMessage, AgentOptions } from "../types/agent";
import type { AgenticGoal } from "../types/agentic";
import { Agent, type ExtendedAgentResponse } from "./agent";
import { AgenticMemorySystem } from "./agentic-memory";
import { AgenticPlanner } from "./agentic-planner";

export interface AgenticAgentResponse extends ExtendedAgentResponse {
	currentGoal?: AgenticGoal | null;
	autonomousMode: boolean;
	nextAction?: string;
}

export class AgenticAgent extends Agent {
	private planner: AgenticPlanner;
	private memory: AgenticMemorySystem;
	private currentGoal: AgenticGoal | null = null;
	private autonomousMode = false;
	private maxAutonomousActions = 10;
	private autonomousActionCount = 0;

	constructor(options: AgentOptions = {}) {
		super(options);
		this.planner = new AgenticPlanner(options.tools || []);
		this.memory = new AgenticMemorySystem();
	}

	async runAgentic(
		history: AgentMessage[],
		llmOptions: UseLLMOptions,
		onProgress?: (response: Partial<AgenticAgentResponse>) => void,
		context?: any,
		autonomousMode = false,
	): Promise<AgenticAgentResponse> {
		this.autonomousMode = autonomousMode;
		this.autonomousActionCount = 0;

		// Extract objective from the latest user message
		const lastUserMessage = history.filter((m) => m.role === "user").pop();
		if (lastUserMessage && !this.currentGoal) {
			this.currentGoal = await this.planner.createGoal(
				lastUserMessage.content,
				context,
			);

			// Add relevant memories to context
			const relevantMemories = this.memory.getRelevantMemories(
				lastUserMessage.content,
			);
			if (relevantMemories.length > 0) {
				const memoryContext = relevantMemories.map((m) => m.content).join("\n");
				history.unshift({
					id: crypto.randomUUID(),
					role: "system",
					content: `Relevant past experiences:\n${memoryContext}`,
				});
			}
		}

		const response = await this.executeGoal(
			history,
			llmOptions,
			onProgress,
			context,
		);

		return {
			...response,
			currentGoal: this.currentGoal,
			autonomousMode: this.autonomousMode,
			nextAction: this.getNextAction(),
		};
	}

	private async executeGoal(
		history: AgentMessage[],
		llmOptions: UseLLMOptions,
		onProgress?: (response: Partial<AgenticAgentResponse>) => void,
		context?: any,
	): Promise<ExtendedAgentResponse> {
		if (!this.currentGoal) {
			return super.run(history, llmOptions, onProgress, context);
		}

		let response: ExtendedAgentResponse;

		do {
			// Execute current task
			response = await super.run(
				history,
				llmOptions,
				(progress) => {
					onProgress?.({
						...progress,
						currentGoal: this.currentGoal,
						autonomousMode: this.autonomousMode,
					});
				},
				context,
			);

			// Learn from the execution
			this.learnFromExecution(response);

			// Update goal progress
			this.updateGoalProgress(response);

			// Check if we should continue autonomously
			if (this.autonomousMode && this.shouldContinueAutonomously(response)) {
				this.autonomousActionCount++;

				// Add the response to history for next iteration
				history.push({
					id: crypto.randomUUID(),
					role: "assistant",
					content: response.message,
				});

				// Add next autonomous action
				const nextAction = this.getNextAction();
				if (nextAction) {
					history.push({
						id: crypto.randomUUID(),
						role: "user",
						content: nextAction,
					});
				}
			} else {
				break;
			}
		} while (
			this.autonomousMode &&
			this.autonomousActionCount < this.maxAutonomousActions &&
			this.currentGoal?.status === "executing"
		);

		return response;
	}

	private learnFromExecution(response: ExtendedAgentResponse): void {
		if (!this.currentGoal) return;

		const context = `Goal: ${this.currentGoal.objective}`;

		if (response.finished && !response.toolResults?.some((r) => r.error)) {
			// Success - learn the pattern
			const actions =
				response.toolCalls?.map((tc) => tc.name).join(", ") || "conversation";
			this.memory.learnFromSuccess(actions, context, response.message);
		} else if (response.toolResults?.some((r) => r.error)) {
			// Failure - learn what went wrong
			const failedActions = response.toolResults
				.filter((r) => r.error)
				.map((r) => r.name)
				.join(", ");
			const errors = response.toolResults
				.filter((r) => r.error)
				.map((r) => r.error)
				.join("; ");

			this.memory.learnFromFailure(failedActions, context, errors);
		}
	}

	private updateGoalProgress(response: ExtendedAgentResponse): void {
		if (!this.currentGoal) return;

		// Update task statuses based on tool results
		if (response.toolResults) {
			response.toolResults.forEach((result) => {
				const task = this.currentGoal?.subTasks.find((t) =>
					t.toolCalls.includes(result.name),
				);

				if (task) {
					task.status = result.error ? "failed" : "completed";
					task.result = result.result;
					task.error = result.error;

					this.planner.updateTaskStatus(
						task.id,
						task.status,
						result.result,
						result.error,
					);
				}
			});
		}

		// Update overall progress
		this.currentGoal.progress = this.planner.calculateProgress(
			this.currentGoal,
		);

		// Check if goal is complete
		if (this.currentGoal.progress === 100) {
			this.currentGoal.status = "completed";
			this.currentGoal.completedAt = new Date();
		}
	}

	private shouldContinueAutonomously(response: ExtendedAgentResponse): boolean {
		if (!this.currentGoal || this.currentGoal.status !== "executing")
			return false;
		if (this.autonomousActionCount >= this.maxAutonomousActions) return false;

		// Continue if there are pending tasks
		const hasPendingTasks = this.currentGoal.subTasks.some(
			(task) => task.status === "pending" || task.status === "executing",
		);

		// Continue if the last response suggests more actions are needed
		const needsMoreActions =
			response.message.toLowerCase().includes("next") ||
			response.message.toLowerCase().includes("continue") ||
			(response.toolCalls && response.toolCalls.length > 0);

		return hasPendingTasks || !!needsMoreActions;
	}

	private getNextAction(): string | undefined {
		if (!this.currentGoal) return undefined;

		const nextTask = this.currentGoal.subTasks.find(
			(task) => task.status === "pending",
		);
		if (nextTask) {
			return `Continue with: ${nextTask.description}`;
		}

		// Check if goal needs refinement
		if (
			this.currentGoal.progress < 100 &&
			this.currentGoal.subTasks.every((t) => t.status !== "pending")
		) {
			return `Analyze progress and determine next steps for: ${this.currentGoal.objective}`;
		}

		return undefined;
	}

	setAutonomousMode(enabled: boolean, maxActions = 10): void {
		this.autonomousMode = enabled;
		this.maxAutonomousActions = maxActions;
		this.autonomousActionCount = 0;
	}

	getCurrentGoal(): AgenticGoal | null {
		return this.currentGoal;
	}

	setCurrentGoal(goal: AgenticGoal): void {
		this.currentGoal = goal;
		this.autonomousActionCount = 0;
	}

	clearCurrentGoal(): void {
		this.currentGoal = null;
		this.autonomousActionCount = 0;
	}

	getMemorySystem(): AgenticMemorySystem {
		return this.memory;
	}
}
