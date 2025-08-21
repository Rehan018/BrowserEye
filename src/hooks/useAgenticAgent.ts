import { useState } from "react";
import { useAppSettings } from "../contexts/AppSettingsContext";
import type { AgenticAgent, AgenticAgentResponse } from "../lib/agentic-agent";
import type { PlannerStep } from "../lib/streaming-tool-parser";
import type { UseLLMOptions } from "../types";
import type { AgentMessage } from "../types/agent";
import type { AgenticGoal } from "../types/agentic";

export const useAgenticAgent = (
	agent: AgenticAgent,
	{
		onMessage,
		onComplete,
		onPlannerUpdate,
		onGoalUpdate,
	}: {
		onMessage?: (message: string) => void;
		onComplete?: (response: AgenticAgentResponse) => void;
		onPlannerUpdate?: (steps: PlannerStep[]) => void;
		onGoalUpdate?: (goal: AgenticGoal | null) => void;
	} = {},
) => {
	const { settings } = useAppSettings();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [plannerSteps, setPlannerSteps] = useState<PlannerStep[]>([]);
	const [currentGoal, setCurrentGoal] = useState<AgenticGoal | null>(null);
	const [autonomousMode, setAutonomousMode] = useState(false);

	const runAgenticAgent = async (
		history: AgentMessage[],
		llmOptions: UseLLMOptions,
		context?: unknown,
		autonomous = false,
	) => {
		if (isLoading) return;

		setError(null);
		setIsLoading(true);
		setPlannerSteps([]);

		try {
			if (settings.developerMode) {
				console.groupCollapsed(
					"Agentic Agent Run:",
					new Date().toLocaleTimeString(),
				);
				console.log("History:", history);
				console.log("LLM Options:", llmOptions);
				console.log("Autonomous Mode:", autonomous);
				console.groupEnd();
			}

			// Set autonomous mode
			agent.setAutonomousMode(autonomous, 10);
			setAutonomousMode(autonomous);

			const response = await agent.runAgentic(
				history,
				llmOptions,
				(progress) => {
					if (progress.message && onMessage) {
						onMessage(progress.message);
					}

					if (progress.plannerSteps) {
						setPlannerSteps(progress.plannerSteps);
						onPlannerUpdate?.(progress.plannerSteps);
					}

					if (progress.currentGoal !== undefined) {
						setCurrentGoal(progress.currentGoal);
						onGoalUpdate?.(progress.currentGoal);
					}
				},
				context,
				autonomous,
			);

			if (onComplete) {
				onComplete(response);
			}

			// Update final state
			setCurrentGoal(response.currentGoal || null);
			setAutonomousMode(response.autonomousMode);

			if (settings.developerMode) {
				console.groupCollapsed(
					"Agentic Agent Response:",
					new Date().toLocaleTimeString(),
				);
				console.log("Response:", response);
				console.log("Current Goal:", response.currentGoal);
				console.log("Autonomous Mode:", response.autonomousMode);
				console.log("Planner Steps:", response.plannerSteps);
				console.groupEnd();
			}
		} catch (error) {
			console.error("Agentic agent run failed:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Sorry, something went wrong.";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const stopAgent = () => {
		agent.stop();
		setIsLoading(false);
		setAutonomousMode(false);
	};

	const clearGoal = () => {
		agent.clearCurrentGoal();
		setCurrentGoal(null);
	};

	const toggleAutonomousMode = (enabled: boolean, maxActions = 10) => {
		agent.setAutonomousMode(enabled, maxActions);
		setAutonomousMode(enabled);
	};

	const getMemoryInsights = () => {
		const memory = agent.getMemorySystem();
		// Could return memory statistics, recent learnings, etc.
		return {
			totalMemories: memory["memories"]?.size || 0,
			// Add more insights as needed
		};
	};

	return {
		isLoading,
		error,
		runAgenticAgent,
		stopAgent,
		plannerSteps,
		currentGoal,
		autonomousMode,
		clearGoal,
		toggleAutonomousMode,
		getMemoryInsights,
	};
};
