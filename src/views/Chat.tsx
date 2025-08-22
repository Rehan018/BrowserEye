import { useEffect, useRef, useState } from "react";
import { AgenticPanel } from "../components/AgenticPanel";
import { DynamicAgentPanel } from "../components/agentic/DynamicAgentPanel";
import ChatMessage from "../components/ChatMessage";
import ContextRibbon from "../components/ContextRibbon";
import EmptyState from "../components/EmptyState";
import PlannerPanel from "../components/PlannerPanel";
import PromptBox from "../components/PromptInput";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { useTabContext } from "../contexts/TabContext";
import { useAgent } from "../hooks/useAgent";
import { useAgenticAgent } from "../hooks/useAgenticAgent";
import { getAgentInstance } from "../lib/agent-instance";
import { Agent } from "../lib/agent";
import { agenticAgent } from "../lib/agentic-agent-instance";
import {
	handleModelCommand,
	type ModelCommandResult,
} from "../lib/modelCommand";
import { PROMPTS } from "../lib/prompts";
import { TOOL_CALL_JSON_CODE_BLOCK_REGEX } from "../lib/regex";
import { useConversationStore } from "../lib/store";
import type { PlannerStep } from "../lib/streaming-tool-parser";
import { fileToDataURL, readStream } from "../lib/utils";
import { streamLlm } from "../services/llm";
import type { LLMMessage } from "../types";
import type { AgentMessage } from "../types/agent";
import { PROVIDERS } from "../utils/providers";

const Chat = () => {
	const [inputValue, setInputValue] = useState("");
	const { contextUrl, contextTitle, contextTabId } = useTabContext();
	const [currentPlannerSteps, setCurrentPlannerSteps] = useState<PlannerStep[]>(
		[],
	);

	const { settings, setSettings } = useAppSettings();
	const {
		conversations,
		currentConversationId,
		validationError,
		addMessages,
		updateLastMessage,
		setConversationTitle,
		startConversation,
		setValidationError,
	} = useConversationStore();

	const [useAgenticMode, setUseAgenticMode] = useState(false);

	const { isLoading, error, runAgent, stopAgent } = useAgent(getAgentInstance() || new Agent(), {
		onMessage: (content) => {
			updateLastMessage({ content });
		},
		onComplete: (response) => {
			// Clean up the message content by removing the raw tool call JSON
			const finalMessage = response.message
				.replace(TOOL_CALL_JSON_CODE_BLOCK_REGEX, "")
				.trim();
			updateLastMessage({
				content: finalMessage,
				toolCalls: response.toolCalls,
				toolResults: response.toolResults,
			});
			setCurrentPlannerSteps([]);
		},
		onPlannerUpdate: (steps) => {
			setCurrentPlannerSteps(steps);
		},
	});

	const {
		isLoading: isAgenticLoading,
		error: agenticError,
		runAgenticAgent,
		stopAgent: stopAgenticAgent,
		currentGoal,
		autonomousMode,
		clearGoal,
		toggleAutonomousMode,
	} = useAgenticAgent(agenticAgent, {
		onMessage: (content) => {
			updateLastMessage({ content });
		},
		onComplete: (response) => {
			const finalMessage = response.message
				.replace(TOOL_CALL_JSON_CODE_BLOCK_REGEX, "")
				.trim();
			updateLastMessage({
				content: finalMessage,
				toolCalls: response.toolCalls,
				toolResults: response.toolResults,
			});
			setCurrentPlannerSteps([]);
		},
		onPlannerUpdate: (steps) => {
			setCurrentPlannerSteps(steps);
		},
	});

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const currentMessages = currentConversationId
		? conversations[currentConversationId]?.messages || []
		: [];

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: This effect runs on mount and when messages change
	useEffect(() => {
		scrollToBottom();
	}, [currentMessages]);

	const handleSubmit = async (images?: File[]) => {
		if (!settings || !settings.selectedProvider || !settings.model) {
			setValidationError("Please select a provider and model in settings.");
			return;
		}

		const provider = PROVIDERS[settings.selectedProvider];
		if (
			provider.requiresApiKey &&
			!settings.apiKeys[settings.selectedProvider]
		) {
			setValidationError(
				`Please enter an API key for ${provider.label} in settings.`,
			);
			return;
		}
		setValidationError(null);

		// Get current page analysis for context
		let pageContext = '';
		try {
			const response = await chrome.runtime.sendMessage({ type: 'GET_PAGE_ANALYSIS' });
			if (response?.analysis) {
				pageContext = `\n\nCurrent page context: ${response.analysis}`;
			}
		} catch (error) {
			console.log('No page analysis available');
		}

		setCurrentPlannerSteps([]);

		const attachments = await Promise.all(
			(images || []).map(async (file) => {
				const { mediaType, data } = await fileToDataURL(file);
				return {
					id: crypto.randomUUID(),
					type: "image" as const,
					mediaType,
					data,
				};
			}),
		);

		const userMessage = {
			id: crypto.randomUUID(),
			role: "user" as const,
			content: inputValue + pageContext,
			attachments,
		};

		if (inputValue.startsWith("/")) {
			const [command, ...args] = inputValue.slice(1).split(" ");

			// Handle model command specially
			if (command === "model") {
				const action = args.join(" ");

				try {
					const result: ModelCommandResult = await handleModelCommand(
						action,
						settings,
						setSettings,
					);

					// Add user's command to conversation
					if (!currentConversationId) {
						startConversation(userMessage);
					} else {
						addMessages([userMessage]);
					}

					// Add system response
					const systemMessage: AgentMessage = {
						id: crypto.randomUUID(),
						role: "assistant",
						content: result.message,
					};

					addMessages([systemMessage]);

					// If model changed, show a brief confirmation
					if (result.modelChanged && result.newModel) {
						console.log(`Model switched to: ${result.newModel}`);
					}
				} catch (error) {
					console.error("Model command error:", error);

					// Add error message to conversation
					if (!currentConversationId) {
						startConversation(userMessage);
					} else {
						addMessages([userMessage]);
					}

					const errorMessage: AgentMessage = {
						id: crypto.randomUUID(),
						role: "assistant",
						content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
					};

					addMessages([errorMessage]);
				}

				setInputValue("");
				return;
			}

			const prompt = PROMPTS.find((p) => p.name === command);

			if (prompt) {
				// Add user's slash command to the conversation
				if (!currentConversationId) {
					startConversation(userMessage);
				} else {
					addMessages([userMessage]);
				}

				const messages = await prompt.getMessages({ text: args.join(" ") });

				if (prompt.llmTrigger) {
					// For LLM triggers, add an empty assistant message and run the agent
					addMessages([
						{
							id: crypto.randomUUID(),
							role: "assistant",
							content: "",
						},
					]);
					const history = [...currentMessages, userMessage, ...messages];
					const llmOptions = {
						provider: settings.selectedProvider,
						model: settings.model,
						apiKey: settings.apiKeys[settings.selectedProvider],
						attachments,
						customUrl: settings.customUrls?.[settings.selectedProvider],
					};
					const context = {
						url: contextUrl,
						title: contextTitle,
						id: contextTabId,
					};

					if (useAgenticMode) {
						runAgenticAgent(history, llmOptions, context, autonomousMode);
					} else {
						runAgent(history, llmOptions, context);
					}
				} else {
					// For direct responses, just add the message from the prompt
					addMessages(messages);
				}

				setInputValue("");
				return;
			}
		}

		if (!currentConversationId) {
			const newConversationId = startConversation(userMessage);
			addMessages([
				{
					id: crypto.randomUUID(),
					role: "assistant" as const,
					content: "",
				},
			]);

			// Generate title in the background
			(async () => {
				const titlePrompt = `Based on the following user query, create a short, descriptive title (3-5 words) for the conversation.

User Query: "${inputValue}"

Title:`;
				const titleLlmMessages: LLMMessage[] = [
					{ role: "user", content: titlePrompt },
				];
				try {
					const stream = streamLlm(titleLlmMessages, {
						provider: settings.selectedProvider,
						apiKey: settings.apiKeys[settings.selectedProvider],
						model: settings.model,
						customUrl: settings.customUrls?.[settings.selectedProvider],
					});
					const title = await readStream(stream);
					setConversationTitle(newConversationId, title.trim());
				} catch (error) {
					console.error("Failed to generate title:", error);
				}
			})();
		} else {
			addMessages([
				userMessage,
				{
					id: crypto.randomUUID(),
					role: "assistant" as const,
					content: "",
				},
			]);
		}

		const history = [...currentMessages, userMessage];
		const llmOptions = {
			provider: settings.selectedProvider,
			model: settings.model,
			apiKey: settings.apiKeys[settings.selectedProvider],
			attachments,
			customUrl: settings.customUrls?.[settings.selectedProvider],
		};
		const context = { url: contextUrl, title: contextTitle, id: contextTabId };

		if (useAgenticMode) {
			runAgenticAgent(history, llmOptions, context, autonomousMode);
		} else {
			runAgent(history, llmOptions, context);
		}
		setInputValue("");
	};

	return (
		<div className="flex flex-col h-full">
			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{/* Agentic Mode Toggle */}
				<div className="flex items-center justify-between bg-white rounded-lg p-3 border">
					<span className="text-sm font-medium text-gray-700">Agentic Mode</span>
					<button
						type="button"
						onClick={() => setUseAgenticMode(!useAgenticMode)}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
							useAgenticMode ? "bg-blue-600" : "bg-gray-200"
						}`}
					>
						<span
							className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
								useAgenticMode ? "translate-x-6" : "translate-x-1"
							}`}
						/>
					</button>
				</div>

				{/* Agentic Panels */}
				{useAgenticMode && (
					<div className="space-y-4">
						<AgenticPanel
							goal={currentGoal}
							autonomousMode={autonomousMode}
							onToggleAutonomous={toggleAutonomousMode}
							onClearGoal={clearGoal}
						/>
						<DynamicAgentPanel onGoalUpdate={(goal) => {
							agenticAgent.setCurrentGoal({
								id: crypto.randomUUID(),
								objective: goal,
								priority: 'medium',
								progress: 0,
								status: 'executing',
								createdAt: new Date(),
								subTasks: []
							});
						}} />
					</div>
				)}

				{/* Chat Messages */}
				{currentMessages.length === 0 && !(isLoading || isAgenticLoading) ? (
					<EmptyState />
				) : (
					<div className="space-y-4">
						{currentMessages
							.filter((msg) => msg.role === "user" || msg.role === "assistant")
							.map((message, index) => {
								const chatMessage = {
									id: message.id,
									type: message.role as "user" | "assistant",
									content: message.content,
									toolCalls: message.toolCalls,
									toolResults: message.toolResults,
									attachments: message.attachments,
								};

								const isLastAssistantMessage =
									message.role === "assistant" &&
									index === currentMessages.length - 1;

								return (
									<div key={message.id}>
										{isLastAssistantMessage &&
											currentPlannerSteps.length > 0 && (
												<PlannerPanel steps={currentPlannerSteps} />
											)}
										{!(isLastAssistantMessage && isLoading) && (
											<ChatMessage message={chatMessage} />
										)}
									</div>
								);
							})}
					</div>
				)}

				{/* Loading State */}
				{(isLoading || isAgenticLoading) && (
					<div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
						<div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
						<span className="text-sm text-blue-700">
							{useAgenticMode && autonomousMode
								? "🤖 Working autonomously..."
								: currentPlannerSteps.length > 0 &&
										currentPlannerSteps.some((s) => !s.isCompleted)
									? "Executing tools..."
									: "Thinking..."}
						</span>
					</div>
				)}

				{/* Error States */}
				{(error || agenticError) && (
					<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
						<div className="flex items-center gap-2">
							<span className="text-red-600 font-medium">Error:</span>
							<span className="text-red-700">{error || agenticError}</span>
						</div>
					</div>
				)}

				{validationError && (
					<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
						<div className="flex items-center gap-2">
							<span className="text-yellow-600 font-medium">Warning:</span>
							<span className="text-yellow-700">{validationError}</span>
						</div>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Input Area */}
			<div className="border-t bg-white p-4">
				<div className="bg-gray-50 rounded-xl overflow-hidden">
					<ContextRibbon url={contextUrl} title={contextTitle} />
					<PromptBox
						prompt={inputValue}
						isLoading={isLoading || isAgenticLoading}
						setPrompt={setInputValue}
						onSubmit={handleSubmit}
						onStop={useAgenticMode ? stopAgenticAgent : stopAgent}
					/>
				</div>
			</div>
		</div>
	);
};

export default Chat;
