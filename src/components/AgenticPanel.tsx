import type React from "react";
import type { AgenticGoal } from "../types/agentic";
import Button from "./ui/Button";
import { Card } from "./ui/Card";

interface AgenticPanelProps {
	goal: AgenticGoal | null;
	autonomousMode: boolean;
	onToggleAutonomous: (enabled: boolean) => void;
	onClearGoal: () => void;
}

export const AgenticPanel: React.FC<AgenticPanelProps> = ({
	goal,
	autonomousMode,
	onToggleAutonomous,
	onClearGoal,
}) => {
	if (!goal) return null;

	const getStatusColor = (status: AgenticGoal["status"]) => {
		switch (status) {
			case "completed":
				return "text-green-600";
			case "failed":
				return "text-red-600";
			case "executing":
				return "text-blue-600";
			case "paused":
				return "text-yellow-600";
			default:
				return "text-gray-600";
		}
	};

	const getPriorityColor = (priority: AgenticGoal["priority"]) => {
		switch (priority) {
			case "critical":
				return "bg-red-100 text-red-800";
			case "high":
				return "bg-orange-100 text-orange-800";
			case "medium":
				return "bg-blue-100 text-blue-800";
			case "low":
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<Card className="p-4 mb-4 border-l-4 border-l-blue-500">
			<div className="flex items-center justify-between mb-3">
				<h3 className="font-semibold text-sm">Current Goal</h3>
				<div className="flex items-center gap-2">
					<span
						className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}
					>
						{goal.priority}
					</span>
					<Button
						size="sm"
						variant="outline"
						onClick={() => onToggleAutonomous(!autonomousMode)}
					>
						{autonomousMode ? "Manual" : "Auto"}
					</Button>
					<Button size="sm" variant="outline" onClick={onClearGoal}>
						Clear
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<p className="text-sm text-gray-700">{goal.objective}</p>

				<div className="flex items-center justify-between text-xs text-gray-500">
					<span className={getStatusColor(goal.status)}>
						Status: {goal.status}
					</span>
					<span>Progress: {goal.progress}%</span>
				</div>

				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className="bg-blue-600 h-2 rounded-full transition-all duration-300"
						style={{ width: `${goal.progress}%` }}
					/>
				</div>

				{goal.subTasks.length > 0 && (
					<div className="mt-3">
						<h4 className="text-xs font-medium text-gray-600 mb-2">
							Tasks ({goal.subTasks.length})
						</h4>
						<div className="space-y-1">
							{goal.subTasks.slice(0, 3).map((task) => (
								<div key={task.id} className="flex items-center gap-2 text-xs">
									<div
										className={`w-2 h-2 rounded-full ${
											task.status === "completed"
												? "bg-green-500"
												: task.status === "executing"
													? "bg-blue-500"
													: task.status === "failed"
														? "bg-red-500"
														: "bg-gray-300"
										}`}
									/>
									<span className="truncate">{task.description}</span>
								</div>
							))}
							{goal.subTasks.length > 3 && (
								<div className="text-xs text-gray-500">
									+{goal.subTasks.length - 3} more tasks
								</div>
							)}
						</div>
					</div>
				)}

				{autonomousMode && (
					<div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
						🤖 Autonomous mode active - AI will continue working independently
					</div>
				)}
			</div>
		</Card>
	);
};
