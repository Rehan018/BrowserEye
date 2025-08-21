import type { LLMMessage, UseLLMOptions } from "../../types";
import { ProviderApiError } from "../errors";
import type { LLM } from "./index";

export class OllamaProvider implements LLM {
	static async listModels(
		_apiKey?: string,
		customUrl?: string,
	): Promise<string[]> {
		const baseUrl = customUrl || "http://localhost:11434";

		try {
			// Use background script for CORS-sensitive requests
			const response = await new Promise<Response>((resolve, reject) => {
				chrome.runtime.sendMessage(
					{
						type: "FETCH_REQUEST",
						data: { url: `${baseUrl}/api/tags`, options: { method: "GET" } },
					},
					(response) => {
						if (chrome.runtime.lastError) {
							reject(new Error(chrome.runtime.lastError.message));
							return;
						}
						if (response.error) {
							reject(new Error(response.error));
							return;
						}
						resolve({
							ok: response.ok,
							status: response.status,
							statusText: response.statusText,
							json: () => Promise.resolve(response.data),
						} as Response);
					},
				);
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch models from Ollama: ${response.status} ${response.statusText}`,
				);
			}

			const data = await response.json();

			// Ollama returns: { models: [{ name: "llama3.2:latest", ... }, ...] }
			if (!data.models || !Array.isArray(data.models)) {
				throw new Error(
					"Invalid response format from Ollama /api/tags endpoint",
				);
			}

			const models = data.models
				.map((model: { name: string }) => model.name)
				.filter((name: string) => name && typeof name === "string")
				.sort();

			return models.length > 0 ? models : getFallbackOllamaModels();
		} catch (error) {
			console.error("Failed to fetch Ollama models:", error);

			// Provide more specific error messages
			if (error instanceof Error) {
				if (error.name === "TimeoutError") {
					throw new Error(
						`Ollama connection timeout. Please ensure Ollama is running on ${baseUrl}`,
					);
				}
				if (error.message.includes("fetch")) {
					throw new Error(
						`Cannot connect to Ollama at ${baseUrl}. Please ensure:\n1. Ollama is installed and running\n2. Run: ollama serve\n3. Check if port 11434 is accessible`,
					);
				}
			}

			// Return fallback models if API fails
			return getFallbackOllamaModels();
		}
	}

	async *generate(
		messages: LLMMessage[],
		options: UseLLMOptions,
		_apiKey: string,
		signal?: AbortSignal,
		customUrl?: string,
	): AsyncGenerator<string> {
		const baseUrl = customUrl || "http://localhost:11434";

		try {
			const response = await fetch(`${baseUrl}/api/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: options.model,
					prompt: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
					stream: true,
					options: {
						temperature: options.temperature || 0.7,
						num_predict: options.maxTokens || 2048,
						top_p: options.topP || 0.9,
					},
				}),
				signal,
			});

			if (!response.ok) {
				if (response.status === 404) {
					throw new ProviderApiError(
						`Model "${options.model}" not found. Try: ollama pull ${options.model}`,
					);
				}
				throw new ProviderApiError(
					`Ollama error: ${response.status} ${response.statusText}`,
				);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new ProviderApiError("No response body");

			const decoder = new TextDecoder();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split("\n").filter((line) => line.trim());

				for (const line of lines) {
					try {
						const data = JSON.parse(line);
						if (data.response) {
							yield data.response;
						}
						if (data.done) break;
					} catch {
						// Skip invalid JSON lines
					}
				}
			}
		} catch (err) {
			const error = err as Error;
			if (error.name === "AbortError") {
				throw new ProviderApiError("Request was cancelled");
			}
			if (error instanceof ProviderApiError) {
				throw error;
			}
			throw new ProviderApiError(`Connection failed: ${error.message}`);
		}
	}
}

function getFallbackOllamaModels(): string[] {
	return [
		"llama3.2:latest",
		"llama3.1:latest",
		"llama3:latest",
		"mistral:latest",
		"codellama:latest",
		"phi3:latest",
		"qwen2.5:latest",
		"gemma2:latest",
	];
}
