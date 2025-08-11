import { BaseAgent, AgentTask, AgentCapability } from './baseAgent';

export class ArchitectAgent extends BaseAgent {
    constructor(ollamaClient: any, logger: any) {
        const capabilities: AgentCapability[] = [
            {
                name: 'System Architecture',
                description: 'Design system architecture and component relationships',
                supportedTasks: ['plan', 'design'],
                maxComplexity: 10
            },
            {
                name: 'Technology Selection',
                description: 'Choose appropriate technologies and frameworks',
                supportedTasks: ['plan'],
                maxComplexity: 8
            },
            {
                name: 'Database Design',
                description: 'Design database schemas and relationships',
                supportedTasks: ['design'],
                maxComplexity: 9
            }
        ];

        super('architect', 'System Architect', 'Designs system architecture and technology stack', capabilities, ollamaClient, logger);
    }

    canHandleTask(task: AgentTask): boolean {
        return task.type === 'plan' || task.type === 'design';
    }

    async executeTask(task: AgentTask): Promise<any> {
        this.logTaskProgress(task, 'Starting architecture task');

        switch (task.type) {
            case 'plan':
                return await this.createSystemPlan(task);
            case 'design':
                return await this.designSystemArchitecture(task);
            default:
                throw new Error(`Unsupported task type: ${task.type}`);
        }
    }

    getPromptTemplate(taskType: string): string {
        switch (taskType) {
            case 'plan':
                return `You are a Senior System Architect. Create a comprehensive system plan for the following application:

Requirements: {requirements}

Please provide:
1. System Overview
2. Technology Stack Recommendations
3. Architecture Patterns
4. Component Breakdown
5. Database Design
6. API Design
7. Security Considerations
8. Scalability Plan
9. Development Phases
10. Risk Assessment

Format the response as a structured plan with clear sections.`;

            case 'design':
                return `You are a Senior System Architect. Design the system architecture for the following application:

Requirements: {requirements}
Technology Stack: {techStack}

Please provide:
1. High-Level Architecture Diagram (in Mermaid format)
2. Component Architecture
3. Data Flow Diagrams
4. API Specifications
5. Database Schema Design
6. Security Architecture
7. Deployment Architecture
8. Performance Considerations

Format the response with clear sections and include Mermaid diagrams where appropriate.`;

            default:
                return 'Please provide a clear description of what you need.';
        }
    }

    private async createSystemPlan(task: AgentTask): Promise<any> {
        const prompt = this.getPromptTemplate('plan')
            .replace('{requirements}', task.description);

        this.logTaskProgress(task, 'Generating system plan');
        
        const response = await this.generateResponse(prompt, {
            taskType: 'plan',
            requirements: task.description
        });

        // Parse the response to extract structured information
        const plan = this.parseSystemPlan(response);
        
        this.logTaskProgress(task, 'System plan generated successfully');
        
        return {
            type: 'system_plan',
            content: response,
            structured: plan,
            generatedAt: new Date()
        };
    }

    private async designSystemArchitecture(task: AgentTask): Promise<any> {
        const prompt = this.getPromptTemplate('design')
            .replace('{requirements}', task.description)
            .replace('{techStack}', task.result?.techStack || 'To be determined');

        this.logTaskProgress(task, 'Designing system architecture');
        
        const response = await this.generateResponse(prompt, {
            taskType: 'design',
            requirements: task.description,
            previousPlan: task.result
        });

        // Parse the response to extract architecture components
        const architecture = this.parseArchitectureDesign(response);
        
        this.logTaskProgress(task, 'System architecture designed successfully');
        
        return {
            type: 'system_architecture',
            content: response,
            structured: architecture,
            generatedAt: new Date()
        };
    }

    private parseSystemPlan(response: string): any {
        // Simple parsing logic - in a real implementation, you might use more sophisticated parsing
        const sections = response.split(/\d+\.\s+/).filter(Boolean);
        
        return {
            overview: sections[0] || '',
            techStack: sections[1] || '',
            architecture: sections[2] || '',
            components: sections[3] || '',
            database: sections[4] || '',
            api: sections[5] || '',
            security: sections[6] || '',
            scalability: sections[7] || '',
            phases: sections[8] || '',
            risks: sections[9] || ''
        };
    }

    private parseArchitectureDesign(response: string): any {
        // Extract Mermaid diagrams and other structured content
        const mermaidMatches = response.match(/```mermaid\n([\s\S]*?)\n```/g);
        const diagrams = mermaidMatches ? mermaidMatches.map(m => m.replace(/```mermaid\n/, '').replace(/\n```/, '')) : [];
        
        return {
            diagrams: diagrams,
            content: response,
            hasMermaidDiagrams: diagrams.length > 0
        };
    }

    // Specialized methods for architecture tasks
    async analyzeRequirements(requirements: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'plan',
            description: `Analyze requirements: ${requirements}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async designDatabaseSchema(entities: string[]): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'design',
            description: `Design database schema for entities: ${entities.join(', ')}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async selectTechnologyStack(requirements: string, constraints: string[]): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'plan',
            description: `Select technology stack for: ${requirements}. Constraints: ${constraints.join(', ')}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }
}
