import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Pause, Play } from 'lucide-react';
import type { Task } from '../../lib/automation/task-queue';

export const TaskMonitor = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [queueStatus, setQueueStatus] = useState({ pending: 0, running: 0, total: 0 });

  useEffect(() => {
    // Listen for task updates
    const handleMessage = (message: any) => {
      if (message.type === 'TASK_UPDATE') {
        setTasks(prev => {
          const existing = prev.find(t => t.id === message.task.id);
          if (existing) {
            return prev.map(t => t.id === message.task.id ? message.task : t);
          } else {
            return [...prev, message.task];
          }
        });
      }
      
      if (message.type === 'QUEUE_STATUS') {
        setQueueStatus(message.status);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Request initial status
    chrome.runtime.sendMessage({ type: 'GET_QUEUE_STATUS' });
    
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <Pause className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 border-yellow-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'cancelled': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const cancelTask = (taskId: string) => {
    chrome.runtime.sendMessage({
      type: 'CANCEL_TASK',
      taskId
    });
  };

  const clearCompleted = () => {
    chrome.runtime.sendMessage({
      type: 'CLEAR_COMPLETED_TASKS'
    });
    
    setTasks(prev => prev.filter(t => !['completed', 'failed', 'cancelled'].includes(t.status)));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Task Monitor</h3>
        <button
          onClick={clearCompleted}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear Completed
        </button>
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-sm text-yellow-700">Pending</div>
          <div className="text-xl font-semibold text-yellow-900">{queueStatus.pending}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-700">Running</div>
          <div className="text-xl font-semibold text-blue-900">{queueStatus.running}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-700">Total</div>
          <div className="text-xl font-semibold text-gray-900">{queueStatus.total}</div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks in queue</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`p-3 border rounded-lg ${getStatusColor(task.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <div className="font-medium text-sm">
                      {task.type.charAt(0).toUpperCase() + task.type.slice(1)} Task
                    </div>
                    <div className="text-xs text-gray-600">
                      Priority: {task.priority} • Created: {task.createdAt.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'failed' ? 'bg-red-100 text-red-700' :
                    task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status}
                  </span>
                  
                  {(task.status === 'pending' || task.status === 'running') && (
                    <button
                      onClick={() => cancelTask(task.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              
              {task.retryCount > 0 && (
                <div className="mt-2 text-xs text-orange-600">
                  Retry {task.retryCount}/{task.maxRetries}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};