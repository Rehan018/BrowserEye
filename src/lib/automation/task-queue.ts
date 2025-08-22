export interface Task {
  id: string;
  type: 'workflow' | 'action' | 'scrape' | 'monitor';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  payload: any;
  createdAt: Date;
  scheduledFor?: Date;
  maxRetries: number;
  retryCount: number;
  timeout: number;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export class TaskQueue {
  private queue: Task[] = [];
  private running: Map<string, Task> = new Map();
  private maxConcurrent = 3;
  private isProcessing = false;
  private listeners: ((task: Task, result?: TaskResult) => void)[] = [];

  addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'>): string {
    const fullTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0
    };

    // Insert based on priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.queue.findIndex(
      t => priorityOrder[t.priority] > priorityOrder[fullTask.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(fullTask);
    } else {
      this.queue.splice(insertIndex, 0, fullTask);
    }

    this.notifyListeners(fullTask);
    this.processQueue();
    
    return fullTask.id;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.running.size >= this.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const task = this.queue.shift();
      if (!task) break;

      // Check if task is scheduled for future
      if (task.scheduledFor && task.scheduledFor > new Date()) {
        this.queue.unshift(task); // Put it back
        break;
      }

      this.executeTask(task);
    }

    this.isProcessing = false;
  }

  private async executeTask(task: Task): Promise<void> {
    task.status = 'running';
    this.running.set(task.id, task);
    this.notifyListeners(task);

    const startTime = Date.now();
    let result: TaskResult;

    try {
      const taskResult = await Promise.race([
        this.runTask(task),
        this.createTimeoutPromise(task.timeout)
      ]);

      result = {
        taskId: task.id,
        success: true,
        result: taskResult,
        duration: Date.now() - startTime
      };

      task.status = 'completed';
      task.onComplete?.(taskResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      result = {
        taskId: task.id,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime
      };

      // Retry logic
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'pending';
        this.queue.unshift(task); // Add back to front of queue
      } else {
        task.status = 'failed';
        task.onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    }

    this.running.delete(task.id);
    this.notifyListeners(task, result);
    
    // Continue processing queue
    setTimeout(() => this.processQueue(), 100);
  }

  private async runTask(task: Task): Promise<any> {
    try {
      switch (task.type) {
        case 'workflow':
          return await this.executeWorkflow(task.payload);
        
        case 'action':
          return await this.executeAction(task.payload);
        
        case 'scrape':
          return await this.executeScrape(task.payload);
        
        case 'monitor':
          return await this.executeMonitor(task.payload);
        
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      console.error(`Task execution failed for ${task.id}:`, error);
      throw error;
    }
  }

  private async executeWorkflow(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Workflow execution timeout'));
      }, 30000);
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'EXECUTE_WORKFLOW',
            workflow: payload
          }, (response) => {
            clearTimeout(timeout);
            
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            if (response?.success) {
              resolve(response.result);
            } else {
              reject(new Error(response?.error || 'Workflow execution failed'));
            }
          });
        } else {
          clearTimeout(timeout);
          reject(new Error('No active tab found'));
        }
      });
    });
  }

  private async executeAction(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Action execution timeout'));
      }, 10000);
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'EXECUTE_ACTION',
            payload
          }, (response) => {
            clearTimeout(timeout);
            
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            if (response?.success) {
              resolve(response.result);
            } else {
              reject(new Error(response?.error || 'Action execution failed'));
            }
          });
        } else {
          clearTimeout(timeout);
          reject(new Error('No active tab found'));
        }
      });
    });
  }

  private async executeScrape(payload: any): Promise<any> {
    // Implementation for scraping tasks
    return { scraped: true, data: payload };
  }

  private async executeMonitor(payload: any): Promise<any> {
    // Implementation for monitoring tasks
    return { monitored: true, status: payload };
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Task timeout')), timeout);
    });
  }

  cancelTask(taskId: string): boolean {
    // Remove from queue
    const queueIndex = this.queue.findIndex(t => t.id === taskId);
    if (queueIndex !== -1) {
      const task = this.queue[queueIndex];
      task.status = 'cancelled';
      this.queue.splice(queueIndex, 1);
      this.notifyListeners(task);
      return true;
    }

    // Cancel running task
    const runningTask = this.running.get(taskId);
    if (runningTask) {
      runningTask.status = 'cancelled';
      this.running.delete(taskId);
      this.notifyListeners(runningTask);
      return true;
    }

    return false;
  }

  getQueueStatus(): { pending: number; running: number; total: number } {
    return {
      pending: this.queue.length,
      running: this.running.size,
      total: this.queue.length + this.running.size
    };
  }

  onTaskUpdate(listener: (task: Task, result?: TaskResult) => void): void {
    this.listeners.push(listener);
  }

  private notifyListeners(task: Task, result?: TaskResult): void {
    this.listeners.forEach(listener => listener(task, result));
  }

  clear(): void {
    this.queue.length = 0;
    this.running.clear();
  }
}