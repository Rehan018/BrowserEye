export interface AgenticGoal {
	id: string;
	objective: string;
	priority: "low" | "medium" | "high" | "critical";
	status: "planning" | "executing" | "completed" | "failed" | "paused";
	subTasks: AgenticTask[];
	progress: number;
	createdAt: Date;
	completedAt?: Date;
	context?: Record<string, unknown>;
}

export interface AgenticTask {
	id: string;
	goalId: string;
	description: string;
	status: "pending" | "executing" | "completed" | "failed";
	toolCalls: string[];
	dependencies: string[];
	result?: unknown;
	error?: string;
	retryCount: number;
	maxRetries: number;
	metadata?: Record<string, unknown>;
}

export interface AgenticMemory {
	id: string;
	type: "fact" | "preference" | "pattern" | "context";
	content: string;
	relevance: number;
	lastAccessed: Date;
	metadata: Record<string, unknown>;
}

export interface AgenticWorkflow {
	id: string;
	name: string;
	description: string;
	triggers: WorkflowTrigger[];
	steps: WorkflowStep[];
	isActive: boolean;
}

export interface WorkflowTrigger {
	type: "keyword" | "url" | "time" | "event";
	condition: string;
	parameters: Record<string, unknown>;
}

export interface WorkflowStep {
	id: string;
	type: "tool" | "condition" | "loop" | "wait";
	action: string;
	parameters: Record<string, unknown>;
	nextStep?: string;
	onError?: string;
}
