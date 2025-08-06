import { Injectable, Logger } from '@nestjs/common';

export interface Task {
  id: string;
  type: 'metadata-processing' | 'file-extraction' | 'backup-creation' | 'cleanup';
  payload: any;
  priority: number; // 1 = highest, 5 = lowest
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  result?: any;
}

@Injectable()
export class TaskQueueService {
  private readonly logger = new Logger(TaskQueueService.name);
  private readonly tasks = new Map<string, Task>();
  private readonly queue: Task[] = [];
  private isProcessing = false;
  private readonly maxConcurrentTasks = 3;
  private activeTasks = 0;

  async addTask(
    type: Task['type'],
    payload: any,
    priority: number = 3,
    maxAttempts: number = 3
  ): Promise<string> {
    const taskId = this.generateTaskId();
    
    const task: Task = {
      id: taskId,
      type,
      payload,
      priority,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts,
      status: 'pending',
    };

    this.tasks.set(taskId, task);
    this.queue.push(task);
    
    // Sort by priority (lower number = higher priority)
    this.queue.sort((a, b) => a.priority - b.priority);
    
    this.logger.log(`Task ${taskId} added to queue: ${type}`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return taskId;
  }

  async getTask(taskId: string): Promise<Task | undefined> {
    return this.tasks.get(taskId);
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    activeTasks: number;
    totalTasks: number;
  }> {
    const allTasks = Array.from(this.tasks.values());
    
    return {
      pending: allTasks.filter(t => t.status === 'pending').length,
      processing: allTasks.filter(t => t.status === 'processing').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      failed: allTasks.filter(t => t.status === 'failed').length,
      activeTasks: this.activeTasks,
      totalTasks: allTasks.length,
    };
  }

  async retryTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    
    if (!task || task.status !== 'failed') {
      return false;
    }
    
    task.status = 'pending';
    task.attempts = 0;
    task.error = undefined;
    
    this.queue.push(task);
    this.queue.sort((a, b) => a.priority - b.priority);
    
    this.logger.log(`Task ${taskId} added back to queue for retry`);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return true;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    
    if (!task || task.status === 'processing') {
      return false;
    }
    
    // Remove from queue if pending
    const queueIndex = this.queue.findIndex(t => t.id === taskId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
    }
    
    this.tasks.delete(taskId);
    this.logger.log(`Task ${taskId} cancelled`);
    
    return true;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.activeTasks >= this.maxConcurrentTasks) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.queue.length > 0 && this.activeTasks < this.maxConcurrentTasks) {
      const task = this.queue.shift();
      if (!task) break;
      
      this.activeTasks++;
      this.processTask(task).finally(() => {
        this.activeTasks--;
      });
    }
    
    this.isProcessing = false;
    
    // Continue processing if there are more tasks
    if (this.queue.length > 0 && this.activeTasks < this.maxConcurrentTasks) {
      setImmediate(() => this.processQueue());
    }
  }

  private async processTask(task: Task): Promise<void> {
    this.logger.log(`Processing task ${task.id}: ${task.type}`);
    
    task.status = 'processing';
    task.attempts++;
    
    try {
      const result = await this.executeTask(task);
      
      task.status = 'completed';
      task.result = result;
      
      this.logger.log(`Task ${task.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Task ${task.id} failed (attempt ${task.attempts}/${task.maxAttempts}):`, error);
      
      task.error = error.message;
      
      if (task.attempts >= task.maxAttempts) {
        task.status = 'failed';
        this.logger.error(`Task ${task.id} failed permanently after ${task.attempts} attempts`);
      } else {
        // Retry with exponential backoff
        const delay = Math.pow(2, task.attempts) * 1000; // 2s, 4s, 8s...
        setTimeout(() => {
          task.status = 'pending';
          this.queue.push(task);
          this.queue.sort((a, b) => a.priority - b.priority);
          
          if (!this.isProcessing) {
            this.processQueue();
          }
        }, delay);
      }
    }
  }

  private async executeTask(task: Task): Promise<any> {
    switch (task.type) {
      case 'metadata-processing':
        return this.processMetadata(task.payload);
      
      case 'file-extraction':
        return this.extractFile(task.payload);
      
      case 'backup-creation':
        return this.createBackup(task.payload);
      
      case 'cleanup':
        return this.performCleanup(task.payload);
      
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async processMetadata(payload: any): Promise<any> {
    // This would integrate with your MetadataService
    this.logger.log(`Processing metadata for game: ${payload.gameId}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return { processed: true, gameId: payload.gameId };
  }

  private async extractFile(payload: any): Promise<any> {
    // This would handle file extraction logic
    this.logger.log(`Extracting file: ${payload.filePath}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return { extracted: true, filePath: payload.filePath };
  }

  private async createBackup(payload: any): Promise<any> {
    // This would handle backup creation
    this.logger.log(`Creating backup: ${payload.type}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return { backup: true, type: payload.type };
  }

  private async performCleanup(payload: any): Promise<any> {
    // This would handle cleanup tasks
    this.logger.log(`Performing cleanup: ${payload.target}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { cleaned: true, target: payload.target };
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup completed tasks older than 24 hours
  async cleanupOldTasks(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tasksToDelete: string[] = [];
    
    this.tasks.forEach((task, id) => {
      if (task.status === 'completed' && task.createdAt < oneDayAgo) {
        tasksToDelete.push(id);
      }
    });
    
    tasksToDelete.forEach(id => {
      this.tasks.delete(id);
    });
    
    if (tasksToDelete.length > 0) {
      this.logger.log(`Cleaned up ${tasksToDelete.length} old completed tasks`);
    }
  }
}
