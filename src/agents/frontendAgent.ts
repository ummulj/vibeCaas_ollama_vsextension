import { BaseAgent, AgentTask, AgentCapability } from './baseAgent';

export class FrontendAgent extends BaseAgent {
    constructor(ollamaClient: any, logger: any) {
        const capabilities: AgentCapability[] = [
            {
                name: 'React Development',
                description: 'Create React components and applications',
                supportedTasks: ['code'],
                maxComplexity: 9
            },
            {
                name: 'UI/UX Design',
                description: 'Design user interfaces and user experience',
                supportedTasks: ['design'],
                maxComplexity: 8
            },
            {
                name: 'Component Architecture',
                description: 'Design reusable component systems',
                supportedTasks: ['design', 'code'],
                maxComplexity: 7
            },
            {
                name: 'State Management',
                description: 'Implement state management solutions',
                supportedTasks: ['code'],
                maxComplexity: 8
            }
        ];

        super('frontend', 'Frontend Developer', 'Creates modern, responsive frontend applications', capabilities, ollamaClient, logger);
    }

    canHandleTask(task: AgentTask): boolean {
        return task.type === 'code' || task.type === 'design';
    }

    async executeTask(task: AgentTask): Promise<any> {
        this.logTaskProgress(task, 'Starting frontend development task');

        switch (task.type) {
            case 'code':
                return await this.generateFrontendCode(task);
            case 'design':
                return await this.designUserInterface(task);
            default:
                throw new Error(`Unsupported task type: ${task.type}`);
        }
    }

    getPromptTemplate(taskType: string): string {
        switch (taskType) {
            case 'code':
                return `You are a Senior Frontend Developer specializing in React, TypeScript, and modern web technologies. Generate production-ready frontend code for the following requirements:

Requirements: {requirements}
Architecture: {architecture}
Design System: {designSystem}

Please provide:
1. Complete React component code with TypeScript
2. CSS/styling (preferably Tailwind CSS or styled-components)
3. State management implementation
4. Props interfaces and types
5. Error handling and loading states
6. Responsive design considerations
7. Accessibility features
8. Unit test examples

Generate clean, maintainable code following React best practices.`;

            case 'design':
                return `You are a Senior UI/UX Designer. Design the user interface for the following application:

Requirements: {requirements}
Target Users: {targetUsers}
Platform: {platform}

Please provide:
1. User Interface Mockups (describe in detail)
2. Component Hierarchy
3. User Flow Diagrams
4. Design System Guidelines
5. Color Palette and Typography
6. Responsive Breakpoints
7. Accessibility Guidelines
8. Interactive Elements

Format the response with clear design specifications and recommendations.`;

            default:
                return 'Please provide a clear description of what you need.';
        }
    }

    private async generateFrontendCode(task: AgentTask): Promise<any> {
        const prompt = this.getPromptTemplate('code')
            .replace('{requirements}', task.description)
            .replace('{architecture}', task.result?.architecture || 'Standard React architecture')
            .replace('{designSystem}', task.result?.designSystem || 'Modern, clean design');

        this.logTaskProgress(task, 'Generating frontend code');
        
        const response = await this.generateResponse(prompt, {
            taskType: 'code',
            requirements: task.description,
            context: task.result
        });

        // Parse the response to extract code components
        const codeComponents = this.parseFrontendCode(response);
        
        this.logTaskProgress(task, 'Frontend code generated successfully');
        
        return {
            type: 'frontend_code',
            content: response,
            components: codeComponents,
            generatedAt: new Date()
        };
    }

    private async designUserInterface(task: AgentTask): Promise<any> {
        const prompt = this.getPromptTemplate('design')
            .replace('{requirements}', task.description)
            .replace('{targetUsers}', task.result?.targetUsers || 'General users')
            .replace('{platform}', task.result?.platform || 'Web application');

        this.logTaskProgress(task, 'Designing user interface');
        
        const response = await this.generateResponse(prompt, {
            taskType: 'design',
            requirements: task.description,
            context: task.result
        });

        // Parse the response to extract design specifications
        const designSpecs = this.parseDesignSpecifications(response);
        
        this.logTaskProgress(task, 'User interface designed successfully');
        
        return {
            type: 'ui_design',
            content: response,
            specifications: designSpecs,
            generatedAt: new Date()
        };
    }

    private parseFrontendCode(response: string): any {
        // Extract code blocks and components
        const codeBlockMatches = response.match(/```(?:tsx?|jsx?|css|html)\n([\s\S]*?)\n```/g);
        const codeBlocks = codeBlockMatches ? codeBlockMatches.map(block => {
            const language = block.match(/```(tsx?|jsx?|css|html)/)?.[1] || 'tsx';
            const code = block.replace(/```(?:tsx?|jsx?|css|html)\n/, '').replace(/\n```/, '');
            return { language, code };
        }) : [];

        // Extract component names and descriptions
        const componentMatches = response.match(/(?:Create|Generate|Build)\s+([A-Z][a-zA-Z]*\s*Component?)/g);
        const components = componentMatches ? componentMatches.map(match => match.replace(/(?:Create|Generate|Build)\s+/, '')) : [];

        return {
            codeBlocks,
            components,
            hasTypeScript: codeBlocks.some(block => block.language.startsWith('ts')),
            hasCSS: codeBlocks.some(block => block.language === 'css'),
            totalCodeBlocks: codeBlocks.length
        };
    }

    private parseDesignSpecifications(response: string): any {
        // Extract design elements from the response
        const colorMatches = response.match(/(?:color|palette|theme):\s*([^\n]+)/gi);
        const typographyMatches = response.match(/(?:font|typography):\s*([^\n]+)/gi);
        const componentMatches = response.match(/(?:component|element):\s*([^\n]+)/gi);

        return {
            colors: colorMatches || [],
            typography: typographyMatches || [],
            components: componentMatches || [],
            hasResponsiveDesign: response.toLowerCase().includes('responsive'),
            hasAccessibility: response.toLowerCase().includes('accessibility'),
            hasUserFlow: response.toLowerCase().includes('user flow') || response.toLowerCase().includes('userflow')
        };
    }

    // Specialized methods for frontend development
    async createReactComponent(componentName: string, requirements: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Create React component: ${componentName} - ${requirements}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async buildComponentLibrary(components: string[]): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Build component library for: ${components.join(', ')}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async implementStateManagement(requirements: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Implement state management for: ${requirements}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async createResponsiveLayout(requirements: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'design',
            description: `Create responsive layout for: ${requirements}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async generateTailwindCSS(componentDescription: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Generate Tailwind CSS for: ${componentDescription}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    // Utility methods for frontend development
    generateComponentFileName(componentName: string): string {
        return `${componentName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}.tsx`;
    }

    generateComponentFolder(componentName: string): string {
        return `src/components/${componentName}`;
    }

    generateTestFileName(componentName: string): string {
        return `${componentName}.test.tsx`;
    }

    generateStoryFileName(componentName: string): string {
        return `${componentName}.stories.tsx`;
    }
}
