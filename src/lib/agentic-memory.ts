import type { AgenticMemory } from "../types/agentic";

interface WebContextMemory {
	domain: string;
	patterns: string[];
	successfulActions: Array<{
		action: string;
		context: string;
		timestamp: Date;
	}>;
	failurePatterns: Array<{ action: string; error: string; timestamp: Date }>;
}

export class AgenticMemorySystem {
	private memories: Map<string, AgenticMemory> = new Map();
	private webContextMemories: Map<string, WebContextMemory> = new Map();
	private maxMemories = 1000;
	private maxWebContextMemories = 100;

	addMemory(
		type: AgenticMemory["type"],
		content: string,
		metadata: Record<string, unknown> = {},
	): string {
		const memory: AgenticMemory = {
			id: crypto.randomUUID(),
			type,
			content,
			relevance: 1.0,
			lastAccessed: new Date(),
			metadata,
		};

		this.memories.set(memory.id, memory);
		this.cleanup();

		return memory.id;
	}

	getRelevantMemories(query: string, limit = 5): AgenticMemory[] {
		const queryLower = query.toLowerCase();
		const scored = Array.from(this.memories.values())
			.map((memory) => ({
				memory,
				score: this.calculateRelevance(memory, queryLower),
			}))
			.filter((item) => item.score > 0.1)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);

		// Update last accessed
		scored.forEach((item) => {
			item.memory.lastAccessed = new Date();
			item.memory.relevance = Math.min(item.memory.relevance + 0.1, 2.0);
		});

		return scored.map((item) => item.memory);
	}

	private calculateRelevance(memory: AgenticMemory, query: string): number {
		const content = memory.content.toLowerCase();
		let score = 0;

		// Exact match
		if (content.includes(query)) score += 1.0;

		// Word overlap
		const queryWords = query.split(" ");
		const contentWords = content.split(" ");
		const overlap = queryWords.filter((word) =>
			contentWords.includes(word),
		).length;
		score += (overlap / queryWords.length) * 0.5;

		// Recency bonus
		const daysSinceAccess =
			(Date.now() - memory.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
		score += Math.max(0, (7 - daysSinceAccess) / 7) * 0.2;

		return score * memory.relevance;
	}

	private cleanup(): void {
		if (this.memories.size <= this.maxMemories) return;

		// Remove oldest, least relevant memories
		const sorted = Array.from(this.memories.entries()).sort((a, b) => {
			const scoreA =
				a[1].relevance * (Date.now() - a[1].lastAccessed.getTime());
			const scoreB =
				b[1].relevance * (Date.now() - b[1].lastAccessed.getTime());
			return scoreA - scoreB;
		});

		const toRemove = sorted.slice(0, this.memories.size - this.maxMemories);
		toRemove.forEach(([id]) => this.memories.delete(id));
	}

	// Enhanced web context memory methods
	addWebContextMemory(
		domain: string,
		action: string,
		context: string,
		success: boolean,
		error?: string,
	): void {
		const domainKey = this.normalizeDomain(domain);

		if (!this.webContextMemories.has(domainKey)) {
			this.webContextMemories.set(domainKey, {
				domain: domainKey,
				patterns: [],
				successfulActions: [],
				failurePatterns: [],
			});
		}

		const webMemory = this.webContextMemories.get(domainKey);
		if (!webMemory) return;

		if (success) {
			webMemory.successfulActions.push({
				action,
				context,
				timestamp: new Date(),
			});

			// Extract patterns from successful actions
			this.extractPatterns(webMemory, action, context);
		} else if (error) {
			webMemory.failurePatterns.push({
				action,
				error,
				timestamp: new Date(),
			});
		}

		this.cleanupWebContextMemories();
	}

	getWebContextMemory(domain: string): WebContextMemory | undefined {
		const domainKey = this.normalizeDomain(domain);
		return this.webContextMemories.get(domainKey);
	}

	getSuccessfulActionsForDomain(
		domain: string,
		actionType?: string,
	): Array<{ action: string; context: string; timestamp: Date }> {
		const webMemory = this.getWebContextMemory(domain);
		if (!webMemory) return [];

		let actions = webMemory.successfulActions;

		if (actionType) {
			actions = actions.filter((a) =>
				a.action.toLowerCase().includes(actionType.toLowerCase()),
			);
		}

		// Sort by recency and success frequency
		return actions
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, 10);
	}

	private normalizeDomain(domain: string): string {
		return domain
			.toLowerCase()
			.replace(/^www\./, "")
			.replace(/\/$/, "");
	}

	private extractPatterns(
		webMemory: WebContextMemory,
		action: string,
		context: string,
	): void {
		// Extract meaningful patterns from successful actions
		const actionWords = action.toLowerCase().split(/\s+/);
		const contextWords = context.toLowerCase().split(/\s+/);

		// Look for recurring patterns
		const patterns = [...actionWords, ...contextWords]
			.filter((word) => word.length > 3 && !this.isStopWord(word))
			.filter((word) => !webMemory.patterns.includes(word));

		webMemory.patterns.push(...patterns);

		// Keep only the most relevant patterns (limit to 50)
		if (webMemory.patterns.length > 50) {
			webMemory.patterns = webMemory.patterns.slice(-50);
		}
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
		];
		return stopWords.includes(word.toLowerCase());
	}

	private cleanupWebContextMemories(): void {
		if (this.webContextMemories.size <= this.maxWebContextMemories) return;

		// Remove oldest web context memories
		const sorted = Array.from(this.webContextMemories.entries()).sort(
			(a, b) => {
				const latestA = Math.max(
					...a[1].successfulActions.map((sa) => sa.timestamp.getTime()),
					...a[1].failurePatterns.map((fp) => fp.timestamp.getTime()),
				);
				const latestB = Math.max(
					...b[1].successfulActions.map((sa) => sa.timestamp.getTime()),
					...b[1].failurePatterns.map((fp) => fp.timestamp.getTime()),
				);
				return latestA - latestB;
			},
		);

		const toRemove = sorted.slice(
			0,
			this.webContextMemories.size - this.maxWebContextMemories,
		);
		toRemove.forEach(([domain]) => this.webContextMemories.delete(domain));
	}

	learnFromSuccess(action: string, context: string, result: string): void {
		this.addMemory(
			"pattern",
			`Action: ${action} in context: ${context} resulted in: ${result}`,
			{
				type: "success_pattern",
				action,
				context,
				result,
			},
		);
	}

	learnFromFailure(action: string, context: string, error: string): void {
		this.addMemory(
			"pattern",
			`Action: ${action} in context: ${context} failed with: ${error}`,
			{
				type: "failure_pattern",
				action,
				context,
				error,
			},
		);
	}

	storeUserPreference(preference: string, value: unknown): void {
		this.addMemory(
			"preference",
			`User prefers ${preference}: ${JSON.stringify(value)}`,
			{
				preference,
				value,
			},
		);
	}
}
