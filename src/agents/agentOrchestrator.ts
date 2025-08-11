import * as vscode from 'vscode';
import { BaseAgent, AgentTask, AgentMessage } from './baseAgent';
import { ArchitectAgent } from './architectAgent';
import { FrontendAgent } from './frontendAgent';
import { BackendAgent } from './backendAgent';
import { DevOpsAgent } from './devopsAgent';
import { OllamaClient } from '../ollamaClient';
import { Logger } from '../logger';

export interface ProjectRequest {
    id: string;
    name: string;
    description: string;
    requirements: string;
    targetPlatform: string;
    complexity: 'simple' | 'medium' | 'complex';
    preferredTechnologies?: string[];
    createdAt: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface ProjectResult {
    id: string;
    name: string;
    architecture: any;
    frontend: any;
    backend: any;
    devops: any;
    deployment: any;
    files: GeneratedFile[];
    createdAt: Date;
    completedAt?: Date;
}

export interface GeneratedFile {
    path: string;
    content: string;
    type: 'frontend' | 'backend' | 'devops' | 'config';
    language: string;
}

export class AgentOrchestrator {
    private agents: Map<string, BaseAgent> = new Map();
    private projects: Map<string, ProjectRequest> = new Map();
    private projectResults: Map<string, ProjectResult> = new Map();
    private ollamaClient: OllamaClient;
    private logger: Logger;

    constructor(ollamaClient: OllamaClient, logger: Logger) {
        this.ollamaClient = ollamaClient;
        this.logger = logger;
        this.initializeAgents();
    }

    private initializeAgents(): void {
        // Initialize all agents
        this.agents.set('architect', new ArchitectAgent(this.ollamaClient, this.logger));
        this.agents.set('frontend', new FrontendAgent(this.ollamaClient, this.logger));
        this.agents.set('backend', new BackendAgent(this.ollamaClient, this.logger));
        this.agents.set('devops', new DevOpsAgent(this.ollamaClient, this.logger));

        this.logger.log('Agent Orchestrator initialized with all agents');
    }

    async createProject(request: Omit<ProjectRequest, 'id' | 'createdAt' | 'status'>): Promise<ProjectRequest> {
        const project: ProjectRequest = {
            ...request,
            id: this.generateProjectId(),
            createdAt: new Date(),
            status: 'pending'
        };

        this.projects.set(project.id, project);
        this.logger.log(`Project created: ${project.name} (${project.id})`);

        return project;
    }

    async executeProject(projectId: string): Promise<ProjectResult> {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }

        this.logger.log(`Starting project execution: ${project.name}`);

        try {
            // Update project status
            project.status = 'in-progress';
            this.projects.set(projectId, project);

            // Execute the project pipeline
            const result = await this.executeProjectPipeline(project);

            // Mark project as completed
            project.status = 'completed';
            this.projects.set(projectId, project);

            // Store the result
            this.projectResults.set(projectId, result);

            this.logger.log(`Project completed successfully: ${project.name}`);

            return result;
        } catch (error) {
            this.logger.error(`Project failed: ${project.name}`, error);
            
            project.status = 'failed';
            this.projects.set(projectId, project);

            throw error;
        }
    }

    private async executeProjectPipeline(project: ProjectRequest): Promise<ProjectResult> {
        this.logger.log(`Executing project pipeline for: ${project.name}`);

        // Phase 1: Architecture and Planning
        this.logger.log('Phase 1: Architecture and Planning');
        const architect = this.agents.get('architect') as ArchitectAgent;
        const architectureTask = await architect.analyzeRequirements(project.requirements);
        const architecture = await architect.processTask(architectureTask);

        // Phase 2: Frontend Development
        this.logger.log('Phase 2: Frontend Development');
        const frontend = this.agents.get('frontend') as FrontendAgent;
        const frontendTask = await frontend.createReactComponent('App', project.requirements);
        const frontendResult = await frontend.processTask(frontendTask);

        // Phase 3: Backend Development
        this.logger.log('Phase 3: Backend Development');
        const backend = this.agents.get('backend') as BackendAgent;
        const backendTask = await backend.createAPIEndpoints(['/api'], project.requirements);
        const backendResult = await backend.processTask(backendTask);

        // Phase 4: DevOps and Deployment
        this.logger.log('Phase 4: DevOps and Deployment');
        const devops = this.agents.get('devops') as DevOpsAgent;
        const devopsTask = await devops.setupDockerEnvironment({ name: project.name });
        const devopsResult = await devops.processTask(devopsTask);

        // Phase 5: Generate all files
        this.logger.log('Phase 5: Generating project files');
        const files = await this.generateProjectFiles(project, {
            architecture,
            frontend: frontendResult,
            backend: backendResult,
            devops: devopsResult
        });

        // Phase 6: Setup deployment
        this.logger.log('Phase 6: Setting up deployment');
        const deploymentTask = await devops.deployToVercel({ name: project.name }, {});
        const deployment = await devops.processTask(deploymentTask);

        const result: ProjectResult = {
            id: project.id,
            name: project.name,
            architecture,
            frontend: frontendResult,
            backend: backendResult,
            devops: devopsResult,
            deployment,
            files,
            createdAt: project.createdAt,
            completedAt: new Date()
        };

        return result;
    }

    private async generateProjectFiles(project: ProjectRequest, results: any): Promise<GeneratedFile[]> {
        const files: GeneratedFile[] = [];

        // Generate project structure
        const projectStructure = this.generateProjectStructure(project, results);
        files.push({
            path: 'README.md',
            content: projectStructure.readme,
            type: 'config',
            language: 'markdown'
        });

        // Generate package.json
        const packageJson = this.generatePackageJson(project, results);
        files.push({
            path: 'package.json',
            content: JSON.stringify(packageJson, null, 2),
            type: 'config',
            language: 'json'
        });

        // Generate frontend files
        if (results.frontend?.components?.codeBlocks) {
            for (const block of results.frontend.components.codeBlocks) {
                if (block.language === 'tsx') {
                    files.push({
                        path: `src/components/App.tsx`,
                        content: block.code,
                        type: 'frontend',
                        language: 'tsx'
                    });
                } else if (block.language === 'css') {
                    files.push({
                        path: `src/components/App.css`,
                        content: block.code,
                        type: 'frontend',
                        language: 'css'
                    });
                }
            }
        }

        // Generate backend files
        if (results.backend?.components?.codeBlocks) {
            for (const block of results.backend.components.codeBlocks) {
                if (block.language === 'ts') {
                    files.push({
                        path: `src/server/index.ts`,
                        content: block.code,
                        type: 'backend',
                        language: 'ts'
                    });
                }
            }
        }

        // Generate DevOps files
        if (results.devops?.code?.codeBlocks) {
            for (const block of results.devops.code.codeBlocks) {
                if (block.language === 'dockerfile') {
                    files.push({
                        path: 'Dockerfile',
                        content: block.code,
                        type: 'devops',
                        language: 'dockerfile'
                    });
                } else if (block.language === 'yaml') {
                    files.push({
                        path: 'docker-compose.yml',
                        content: block.code,
                        type: 'devops',
                        language: 'yaml'
                    });
                }
            }
        }

        return files;
    }

    private generateProjectStructure(project: ProjectRequest, results: any): { readme: string } {
        const readme = `# ${project.name}

${project.description}

## Project Overview

This project was automatically generated using VibeCaas AI-powered development agents.

## Architecture

${results.architecture?.content || 'Architecture details will be generated during development.'}

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for containerized deployment)
- Ollama (for local AI models)

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

### Deployment

\`\`\`bash
npm run deploy
\`\`\`

## Project Structure

\`\`\`
${project.name}/
├── src/
│   ├── components/     # Frontend components
│   ├── server/         # Backend server
│   └── utils/          # Utility functions
├── public/             # Static assets
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose
└── README.md           # This file
\`\`\`

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Neon)
- **Deployment**: Docker, Vercel
- **AI Generation**: Ollama (Local)

## Generated by

VibeCaas AI Development Agents
- System Architect: ${results.architecture?.generatedAt ? '✅' : '⏳'}
- Frontend Developer: ${results.frontend?.generatedAt ? '✅' : '⏳'}
- Backend Developer: ${results.backend?.generatedAt ? '✅' : '⏳'}
- DevOps Engineer: ${results.devops?.generatedAt ? '✅' : '⏳'}

Generated on: ${new Date().toISOString()}
`;

        return { readme };
    }

    private generatePackageJson(project: ProjectRequest, results: any): any {
        return {
            name: project.name.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: project.description,
            main: 'src/server/index.ts',
            scripts: {
                dev: 'concurrently \"npm run dev:frontend\" \"npm run dev:backend\"',
                'dev:frontend': 'vite',
                'dev:backend': 'tsx watch src/server/index.ts',
                build: 'npm run build:frontend && npm run build:backend',
                'build:frontend': 'vite build',
                'build:backend': 'tsc -p tsconfig.server.json',
                start: 'node dist/server/index.js',
                deploy: 'vercel --prod',
                test: 'jest',
                'test:watch': 'jest --watch'
            },
            dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
                'express': '^4.18.2',
                'cors': '^2.8.5',
                'helmet': '^7.1.0',
                'dotenv': '^16.3.1',
                'pg': '^8.11.3',
                'bcryptjs': '^2.4.3',
                'jsonwebtoken': '^9.0.2'
            },
            devDependencies: {
                '@types/react': '^18.2.37',
                '@types/react-dom': '^18.2.15',
                '@types/express': '^4.17.21',
                '@types/cors': '^2.8.17',
                '@types/pg': '^8.10.7',
                '@types/bcryptjs': '^2.4.6',
                '@types/jsonwebtoken': '^9.0.5',
                '@types/node': '^20.8.10',
                '@vitejs/plugin-react': '^4.1.1',
                'typescript': '^5.2.2',
                'vite': '^4.5.0',
                'tsx': '^4.6.2',
                'concurrently': '^8.2.2',
                'jest': '^29.7.0',
                '@types/jest': '^29.5.8'
            },
            engines: {
                node: '>=18.0.0'
            },
            keywords: [
                'ai-generated',
                'react',
                'nodejs',
                'typescript',
                'fullstack'
            ],
            author: 'VibeCaas AI',
            license: 'MIT'
        };
    }

    // Project management methods
    getProject(projectId: string): ProjectRequest | undefined {
        return this.projects.get(projectId);
    }

    getAllProjects(): ProjectRequest[] {
        return Array.from(this.projects.values());
    }

    getProjectResult(projectId: string): ProjectResult | undefined {
        return this.projectResults.get(projectId);
    }

    // Agent management methods
    getAgent(agentId: string): BaseAgent | undefined {
        return this.agents.get(agentId);
    }

    getAllAgents(): BaseAgent[] {
        return Array.from(this.agents.values());
    }

    getAgentStatus(agentId: string): any {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return { error: 'Agent not found' };
        }

        return {
            id: agent.getId(),
            name: agent.getName(),
            description: agent.getDescription(),
            capabilities: agent.getCapabilities(),
            status: agent.getStatus(),
            messages: agent.getMessages().length
        };
    }

    // Utility methods
    private generateProjectId(): string {
        return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Communication between agents
    async sendMessageToAgent(agentId: string, message: AgentMessage): Promise<void> {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.sendMessage(message);
            this.logger.log(`Message sent to agent ${agentId}: ${message.type}`);
        } else {
            this.logger.error(`Agent not found: ${agentId}`);
        }
    }

    async broadcastMessage(message: AgentMessage): Promise<void> {
        for (const agent of this.agents.values()) {
            agent.sendMessage(message);
        }
        this.logger.log(`Broadcast message sent to all agents: ${message.type}`);
    }

    // Project execution monitoring
    async getProjectProgress(projectId: string): Promise<any> {
        const project = this.projects.get(projectId);
        if (!project) {
            return { error: 'Project not found' };
        }

        const agentStatuses: Record<string, any> = {};
        for (const [agentId, agent] of this.agents.entries()) {
            agentStatuses[agentId] = agent.getStatus();
        }

        return {
            project,
            agentStatuses,
            overallProgress: this.calculateOverallProgress(project, agentStatuses)
        };
    }

    private calculateOverallProgress(project: ProjectRequest, agentStatuses: Record<string, any>): number {
        if (project.status === 'completed') return 100;
        if (project.status === 'failed') return 0;

        // Calculate progress based on agent task completion
        let totalTasks = 0;
        let completedTasks = 0;

        for (const status of Object.values(agentStatuses)) {
            if (status && typeof status === 'object' && 'totalTasks' in status && 'completed' in status) {
                totalTasks += status.totalTasks || 0;
                completedTasks += status.completed || 0;
            }
        }

        return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }

    // Cleanup methods
    async cleanupProject(projectId: string): Promise<void> {
        this.projects.delete(projectId);
        this.projectResults.delete(projectId);
        this.logger.log(`Project cleaned up: ${projectId}`);
    }

    async cleanupAllProjects(): Promise<void> {
        this.projects.clear();
        this.projectResults.clear();
        this.logger.log('All projects cleaned up');
    }
}
