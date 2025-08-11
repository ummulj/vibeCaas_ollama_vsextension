import { BaseAgent, AgentTask, AgentCapability } from './baseAgent';

export class BackendAgent extends BaseAgent {
    constructor(ollamaClient: any, logger: any) {
        const capabilities: AgentCapability[] = [
            {
                name: 'API Development',
                description: 'Create RESTful APIs and GraphQL endpoints',
                supportedTasks: ['code'],
                maxComplexity: 9
            },
            {
                name: 'Database Integration',
                description: 'Implement database models and queries',
                supportedTasks: ['code'],
                maxComplexity: 8
            },
            {
                name: 'Authentication & Security',
                description: 'Implement security features and user authentication',
                supportedTasks: ['code'],
                maxComplexity: 9
            },
            {
                name: 'Server Architecture',
                description: 'Design server-side architecture and middleware',
                supportedTasks: ['design', 'code'],
                maxComplexity: 8
            }
        ];

        super('backend', 'Backend Developer', 'Creates robust backend services and APIs', capabilities, ollamaClient, logger);
    }

    canHandleTask(task: AgentTask): boolean {
        return task.type === 'code' || task.type === 'design';
    }

    async executeTask(task: AgentTask): Promise<any> {
        this.logTaskProgress(task, 'Starting backend development task');

        switch (task.type) {
            case 'code':
                return await this.generateBackendCode(task);
            case 'design':
                return await this.designBackendArchitecture(task);
            default:
                throw new Error(`Unsupported task type: ${task.type}`);
        }
    }

    getPromptTemplate(taskType: string): string {
        switch (taskType) {
            case 'code':
                return `You are a Senior Backend Developer specializing in Node.js, Express, FastAPI, and modern backend technologies. Generate production-ready backend code for the following requirements:

Requirements: {requirements}
Architecture: {architecture}
Database: {database}
Framework: {framework}

Please provide:
1. Complete server setup and configuration
2. API endpoint implementations
3. Database models and schemas
4. Authentication and authorization
5. Input validation and error handling
6. Middleware implementations
7. Environment configuration
8. Unit test examples
9. API documentation
10. Security considerations

Generate clean, maintainable code following backend best practices. Include proper error handling, logging, and security measures.`;

            case 'design':
                return `You are a Senior Backend Architect. Design the backend architecture for the following application:

Requirements: {requirements}
Expected Load: {expectedLoad}
Security Requirements: {securityRequirements}

Please provide:
1. Server Architecture Design
2. API Design and Endpoints
3. Database Design and Relationships
4. Authentication and Authorization Flow
5. Security Architecture
6. Scalability Considerations
7. Performance Optimization
8. Monitoring and Logging
9. Deployment Strategy
10. API Documentation Structure

Format the response with clear architectural specifications and diagrams where appropriate.`;

            default:
                return 'Please provide a clear description of what you need.';
        }
    }

    private async generateBackendCode(task: AgentTask): Promise<any> {
        const prompt = this.getPromptTemplate('code')
            .replace('{requirements}', task.description)
            .replace('{architecture}', task.result?.architecture || 'Standard backend architecture')
            .replace('{database}', task.result?.database || 'PostgreSQL/Neon')
            .replace('{framework}', task.result?.framework || 'Express.js/Node.js');

        this.logTaskProgress(task, 'Generating backend code');
        
        const response = await this.generateResponse(prompt, {
            taskType: 'code',
            requirements: task.description,
            context: task.result
        });

        // Parse the response to extract code components
        const codeComponents = this.parseBackendCode(response);
        
        this.logTaskProgress(task, 'Backend code generated successfully');
        
        return {
            type: 'backend_code',
            content: response,
            components: codeComponents,
            generatedAt: new Date()
        };
    }

    private async designBackendArchitecture(task: AgentTask): Promise<any> {
        const prompt = this.getPromptTemplate('design')
            .replace('{requirements}', task.description)
            .replace('{expectedLoad}', task.result?.expectedLoad || 'Medium traffic')
            .replace('{securityRequirements}', task.result?.securityRequirements || 'Standard web security');

        this.logTaskProgress(task, 'Designing backend architecture');
        
        const response = await this.generateResponse(prompt, {
            taskType: 'design',
            requirements: task.description,
            context: task.result
        });

        // Parse the response to extract architecture specifications
        const architectureSpecs = this.parseArchitectureSpecifications(response);
        
        this.logTaskProgress(task, 'Backend architecture designed successfully');
        
        return {
            type: 'backend_architecture',
            content: response,
            specifications: architectureSpecs,
            generatedAt: new Date()
        };
    }

    private parseBackendCode(response: string): any {
        // Extract code blocks and components
        const codeBlockMatches = response.match(/```(?:js|ts|json|sql|yaml|env)\n([\s\S]*?)\n```/g);
        const codeBlocks = codeBlockMatches ? codeBlockMatches.map(block => {
            const language = block.match(/```(js|ts|json|sql|yaml|env)/)?.[1] || 'js';
            const code = block.replace(/```(?:js|ts|json|sql|yaml|env)\n/, '').replace(/\n```/, '');
            return { language, code };
        }) : [];

        // Extract API endpoints
        const endpointMatches = response.match(/(?:GET|POST|PUT|DELETE|PATCH)\s+(\/[a-zA-Z0-9\/\-_]+)/g);
        const endpoints = endpointMatches || [];

        // Extract database models
        const modelMatches = response.match(/(?:class|interface|type)\s+([A-Z][a-zA-Z]*)\s*(?:implements|extends|{)/g);
        const models = modelMatches ? modelMatches.map(match => match.match(/(?:class|interface|type)\s+([A-Z][a-zA-Z]*)/)?.[1]).filter(Boolean) : [];

        return {
            codeBlocks,
            endpoints,
            models,
            hasTypeScript: codeBlocks.some(block => block.language === 'ts'),
            hasSQL: codeBlocks.some(block => block.language === 'sql'),
            hasEnvironmentConfig: codeBlocks.some(block => block.language === 'env'),
            totalCodeBlocks: codeBlocks.length
        };
    }

    private parseArchitectureSpecifications(response: string): any {
        // Extract architectural elements from the response
        const apiMatches = response.match(/(?:API|endpoint):\s*([^\n]+)/gi);
        const databaseMatches = response.match(/(?:database|model):\s*([^\n]+)/gi);
        const securityMatches = response.match(/(?:security|auth):\s*([^\n]+)/gi);
        const scalabilityMatches = response.match(/(?:scalability|performance):\s*([^\n]+)/gi);

        return {
            apis: apiMatches || [],
            databases: databaseMatches || [],
            security: securityMatches || [],
            scalability: scalabilityMatches || [],
            hasLoadBalancing: response.toLowerCase().includes('load balancer') || response.toLowerCase().includes('load balancing'),
            hasCaching: response.toLowerCase().includes('cache') || response.toLowerCase().includes('caching'),
            hasMicroservices: response.toLowerCase().includes('microservice') || response.toLowerCase().includes('microservices')
        };
    }

    // Specialized methods for backend development
    async createAPIEndpoints(endpoints: string[], requirements: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Create API endpoints: ${endpoints.join(', ')} - ${requirements}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async implementDatabaseModels(entities: string[], databaseType: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Implement database models for entities: ${entities.join(', ')} using ${databaseType}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async setupAuthentication(authType: string, requirements: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Setup ${authType} authentication: ${requirements}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async createMiddleware(middlewareType: string, requirements: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Create ${middlewareType} middleware: ${requirements}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async setupDatabaseConnection(databaseType: string, connectionString: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Setup ${databaseType} connection: ${connectionString}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    async implementValidation(validationType: string, requirements: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Implement ${validationType} validation: ${requirements}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date()
        };

        return await this.processTask(task);
    }

    // Utility methods for backend development
    generateAPIFileName(endpointName: string): string {
        return `${endpointName.replace(/\//g, '-').replace(/^-/, '')}.ts`;
    }

    generateModelFileName(modelName: string): string {
        return `${modelName.toLowerCase()}.model.ts`;
    }

    generateControllerFileName(controllerName: string): string {
        return `${controllerName.toLowerCase()}.controller.ts`;
    }

    generateServiceFileName(serviceName: string): string {
        return `${serviceName.toLowerCase()}.service.ts`;
    }

    generateTestFileName(fileName: string): string {
        return `${fileName.replace('.ts', '')}.test.ts`;
    }

    generateRouteFileName(routeName: string): string {
        return `${routeName.toLowerCase()}.routes.ts`;
    }

    // Database utility methods
    generateSQLTableName(entityName: string): string {
        return entityName.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase();
    }

    generateSQLColumnName(fieldName: string): string {
        return fieldName.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase();
    }

    // API utility methods
    generateEndpointPath(resource: string, action?: string): string {
        const basePath = `/${resource.toLowerCase()}`;
        if (action) {
            return `${basePath}/${action.toLowerCase()}`;
        }
        return basePath;
    }

    generateHTTPMethod(action: string): string {
        const methodMap: { [key: string]: string } = {
            'create': 'POST',
            'read': 'GET',
            'update': 'PUT',
            'delete': 'DELETE',
            'patch': 'PATCH'
        };
        return methodMap[action.toLowerCase()] || 'GET';
    }
}
