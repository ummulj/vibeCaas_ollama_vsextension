import * as vscode from 'vscode';
import { OllamaClient } from '../ollamaClient';
import { Logger } from '../logger';

export interface AgentTask {
    id: string;
    type: 'plan' | 'design' | 'code' | 'test' | 'deploy';
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    dependencies: string[];
    result?: any;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

export interface AgentMessage {
    from: string;
    to: string;
    type: 'task' | 'result' | 'request' | 'response';
    content: any;
    timestamp: Date;
}

export interface AgentCapability {
    name: string;
    description: string;
    supportedTasks: string[];
    maxComplexity: number;
}

export abstract class BaseAgent {
    protected id: string;
    protected name: string;
    protected description: string;
    protected capabilities: AgentCapability[];
    protected ollamaClient: OllamaClient;
    protected logger: Logger;
    protected tasks: Map<string, AgentTask> = new Map();
    protected messageQueue: AgentMessage[] = [];

    constructor(
        id: string,
        name: string,
        description: string,
        capabilities: AgentCapability[],
        ollamaClient: OllamaClient,
        logger: Logger
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.capabilities = capabilities;
        this.ollamaClient = ollamaClient;
        this.logger = logger;
    }

    // Abstract methods that must be implemented by subclasses
    abstract canHandleTask(task: AgentTask): boolean;
    abstract executeTask(task: AgentTask): Promise<any>;
    abstract getPromptTemplate(taskType: string): string;

    // Common methods
    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    getCapabilities(): AgentCapability[] {
        return this.capabilities;
    }

    canHandleTaskType(taskType: string): boolean {
        return this.capabilities.some(cap => cap.supportedTasks.includes(taskType));
    }

    async processTask(task: AgentTask): Promise<AgentTask> {
        if (!this.canHandleTask(task)) {
            throw new Error(`Agent ${this.name} cannot handle task type: ${task.type}`);
        }

        try {
            this.logger.log(`Agent ${this.name} starting task: ${task.description}`);
            
            // Update task status
            task.status = 'in-progress';
            this.tasks.set(task.id, task);

            // Execute the task
            const result = await this.executeTask(task);
            
            // Mark as completed
            task.status = 'completed';
            task.result = result;
            task.completedAt = new Date();
            
            this.logger.log(`Agent ${this.name} completed task: ${task.description}`);
            
            return task;
        } catch (error) {
            this.logger.error(`Agent ${this.name} failed task: ${task.description}`, error);
            
            task.status = 'failed';
            task.error = error instanceof Error ? error.message : String(error);
            
            return task;
        }
    }

    async generateResponse(prompt: string, context?: any): Promise<string> {
        try {
            const response = await this.ollamaClient.generate({
                model: 'mistral:latest', // Default model, can be overridden
                prompt: prompt,
                context: context,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 2048
                }
            });

            return response.response;
        } catch (error) {
            this.logger.error(`Failed to generate response for agent ${this.name}`, error);
            throw new Error(`Agent response generation failed: ${error}`);
        }
    }

    addTask(task: AgentTask): void {
        this.tasks.set(task.id, task);
    }

    getTask(taskId: string): AgentTask | undefined {
        return this.tasks.get(taskId);
    }

    getAllTasks(): AgentTask[] {
        return Array.from(this.tasks.values());
    }

    getPendingTasks(): AgentTask[] {
        return Array.from(this.tasks.values()).filter(task => task.status === 'pending');
    }

    getInProgressTasks(): AgentTask[] {
        return Array.from(this.tasks.values()).filter(task => task.status === 'in-progress');
    }

    getCompletedTasks(): AgentTask[] {
        return Array.from(this.tasks.values()).filter(task => task.status === 'completed');
    }

    getFailedTasks(): AgentTask[] {
        return Array.from(this.tasks.values()).filter(task => task.status === 'failed');
    }

    sendMessage(message: AgentMessage): void {
        this.messageQueue.push(message);
    }

    getMessages(): AgentMessage[] {
        return this.messageQueue;
    }

    clearMessages(): void {
        this.messageQueue = [];
    }

    getStatus(): { 
        totalTasks: number; 
        pending: number; 
        inProgress: number; 
        completed: number; 
        failed: number; 
    } {
        const tasks = Array.from(this.tasks.values());
        return {
            totalTasks: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            failed: tasks.filter(t => t.status === 'failed').length
        };
    }

    // Utility methods
    protected generateTaskId(): string {
        return `${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    protected validateTask(task: AgentTask): boolean {
        if (!task.id || !task.type || !task.description) {
            return false;
        }
        
        if (!this.canHandleTaskType(task.type)) {
            return false;
        }

        return true;
    }

    protected async waitForDependencies(task: AgentTask): Promise<void> {
        if (task.dependencies.length === 0) {
            return;
        }

        const checkDependencies = () => {
            return task.dependencies.every(depId => {
                const depTask = this.tasks.get(depId);
                return depTask && depTask.status === 'completed';
            });
        };

        // Wait for dependencies to complete
        while (!checkDependencies()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    protected logTaskProgress(task: AgentTask, message: string): void {
        this.logger.log(`[${this.name}] Task ${task.id}: ${message}`);
    }
}
