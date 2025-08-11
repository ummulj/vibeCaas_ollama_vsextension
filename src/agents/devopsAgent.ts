import { BaseAgent, AgentTask, AgentCapability } from './baseAgent';

export class DevOpsAgent extends BaseAgent {
    constructor(ollamaClient: any, logger: any) {
        const capabilities: AgentCapability[] = [
            {
                name: 'Deployment Automation',
                description: 'Automate application deployment to various platforms',
                supportedTasks: ['deploy'],
                maxComplexity: 9
            },
            {
                name: 'Infrastructure as Code',
                description: 'Create infrastructure definitions and configurations',
                supportedTasks: ['code'],
                maxComplexity: 8
            },
            {
                name: 'CI/CD Pipeline',
                description: 'Set up continuous integration and deployment pipelines',
                supportedTasks: ['code'],
                maxComplexity: 8
            },
            {
                name: 'Container Orchestration',
                description: 'Manage Docker containers and Kubernetes deployments',
                supportedTasks: ['code', 'deploy'],
                maxComplexity: 9
            }
        ];

        super('devops', 'DevOps Engineer', 'Handles deployment, infrastructure, and CI/CD automation', capabilities, ollamaClient, logger);
    }

    canHandleTask(task: AgentTask): boolean {
        return task.type === 'deploy' || task.type === 'code';
    }

    async executeTask(task: AgentTask): Promise<any> {
        this.logTaskProgress(task, 'Starting DevOps task');

        switch (task.type) {
            case 'deploy':
                return await this.handleDeployment(task);
            case 'code':
                return await this.generateDevOpsCode(task);
            default:
                throw new Error(`Unsupported task type: ${task.type}`);
        }
    }

    getPromptTemplate(taskType: string): string {
        switch (taskType) {
            case 'deploy':
                return `You are a Senior DevOps Engineer. Handle the deployment of the following application:

Application: {application}
Platform: {platform}
Requirements: {requirements}

Please provide:
1. Deployment Strategy
2. Environment Configuration
3. Required Infrastructure
4. Deployment Commands
5. Environment Variables
6. Health Checks
7. Rollback Procedures
8. Monitoring Setup
9. Security Considerations
10. Cost Optimization

Generate deployment-ready configurations and scripts.`;

            case 'code':
                return `You are a Senior DevOps Engineer. Generate infrastructure and CI/CD code for the following application:

Application: {application}
Requirements: {requirements}
Infrastructure: {infrastructure}

Please provide:
1. Dockerfile and docker-compose.yml
2. Kubernetes manifests (if applicable)
3. CI/CD pipeline configurations
4. Infrastructure as Code (Terraform/CloudFormation)
5. Environment configuration files
6. Monitoring and logging setup
7. Security configurations
8. Backup and disaster recovery
9. Performance optimization
10. Cost management

Generate production-ready DevOps configurations.`;

            default:
                return 'Please provide a clear description of what you need.';
        }
    }

    private async handleDeployment(task: AgentTask): Promise<any> {
        const prompt = this.getPromptTemplate('deploy')
            .replace('{application}', task.description)
            .replace('{platform}', task.result?.platform || 'Vercel/Cloud platforms')
            .replace('{requirements}', task.result?.requirements || 'Standard deployment');

        this.logTaskProgress(task, 'Handling deployment');
        
        const response = await this.generateResponse(prompt, {
            taskType: 'deploy',
            application: task.description,
            context: task.result
        });

        // Parse the response to extract deployment information
        const deploymentInfo = this.parseDeploymentInfo(response);
        
        this.logTaskProgress(task, 'Deployment handled successfully');
        
        return {
            type: 'deployment',
            content: response,
            deployment: deploymentInfo,
            generatedAt: new Date()
        };
    }

    private async generateDevOpsCode(task: AgentTask): Promise<any> {
        const prompt = this.getPromptTemplate('code')
            .replace('{application}', task.description)
            .replace('{requirements}', task.result?.requirements || 'Standard DevOps setup')
            .replace('{infrastructure}', task.result?.infrastructure || 'Cloud-based infrastructure');

        this.logTaskProgress(task, 'Generating DevOps code');
        
        const response = await this.generateResponse(prompt, {
            taskType: 'code',
            application: task.description,
            context: task.result
        });

        // Parse the response to extract DevOps code components
        const devOpsCode = this.parseDevOpsCode(response);
        
        this.logTaskProgress(task, 'DevOps code generated successfully');
        
        return {
            type: 'devops_code',
            content: response,
            code: devOpsCode,
            generatedAt: new Date()
        };
    }

    private parseDeploymentInfo(response: string): any {
        // Extract deployment-related information
        const platformMatches = response.match(/(?:deploy to|platform|hosting):\s*([^\n]+)/gi);
        const commandMatches = response.match(/(?:command|script):\s*([^\n]+)/gi);
        const envMatches = response.match(/(?:environment|env):\s*([^\n]+)/gi);

        return {
            platforms: platformMatches || [],
            commands: commandMatches || [],
            environments: envMatches || [],
            hasDocker: response.toLowerCase().includes('docker'),
            hasKubernetes: response.toLowerCase().includes('kubernetes') || response.toLowerCase().includes('k8s'),
            hasCI: response.toLowerCase().includes('ci/cd') || response.toLowerCase().includes('pipeline'),
            hasMonitoring: response.toLowerCase().includes('monitoring') || response.toLowerCase().includes('logging')
        };
    }

    private parseDevOpsCode(response: string): any {
        // Extract code blocks and configurations
        const codeBlockMatches = response.match(/```(?:yaml|yml|json|dockerfile|tf|hcl|sh|bash)\n([\s\S]*?)\n```/g);
        const codeBlocks = codeBlockMatches ? codeBlockMatches.map(block => {
            const language = block.match(/```(yaml|yml|json|dockerfile|tf|hcl|sh|bash)/)?.[1] || 'yaml';
            const code = block.replace(/```(?:yaml|yml|json|dockerfile|tf|hcl|sh|bash)\n/, '').replace(/\n```/, '');
            return { language, code };
        }) : [];

        // Extract infrastructure components
        const infraMatches = response.match(/(?:infrastructure|service):\s*([^\n]+)/gi);
        const securityMatches = response.match(/(?:security|auth):\s*([^\n]+)/gi);

        return {
            codeBlocks,
            infrastructure: infraMatches || [],
            security: securityMatches || [],
            hasDocker: codeBlocks.some(block => block.language === 'dockerfile'),
            hasKubernetes: codeBlocks.some(block => block.language === 'yaml' || block.language === 'yml'),
            hasTerraform: codeBlocks.some(block => block.language === 'tf' || block.language === 'hcl'),
            hasShellScripts: codeBlocks.some(block => block.language === 'sh' || block.language === 'bash'),
            totalCodeBlocks: codeBlocks.length
        };
    }

    // Specialized methods for DevOps tasks
    async deployToVercel(application: any, configuration: any): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'deploy',
            description: `Deploy application to Vercel: ${application.name}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date(),
            result: { platform: 'Vercel', application, configuration }
        };

        return await this.processTask(task);
    }

    async setupDockerEnvironment(application: any): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Setup Docker environment for: ${application.name}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date(),
            result: { infrastructure: 'Docker', application }
        };

        return await this.processTask(task);
    }

    async createKubernetesManifests(application: any): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Create Kubernetes manifests for: ${application.name}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date(),
            result: { infrastructure: 'Kubernetes', application }
        };

        return await this.processTask(task);
    }

    async setupCICDPipeline(application: any, platform: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Setup CI/CD pipeline for: ${application.name} on ${platform}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date(),
            result: { infrastructure: platform, application }
        };

        return await this.processTask(task);
    }

    async configureMonitoring(application: any): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Configure monitoring for: ${application.name}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date(),
            result: { infrastructure: 'Monitoring', application }
        };

        return await this.processTask(task);
    }

    async setupDatabaseInfrastructure(databaseType: string, requirements: string): Promise<any> {
        const task: AgentTask = {
            id: this.generateTaskId(),
            type: 'code',
            description: `Setup ${databaseType} infrastructure: ${requirements}`,
            status: 'pending',
            dependencies: [],
            createdAt: new Date(),
            result: { infrastructure: databaseType, requirements }
        };

        return await this.processTask(task);
    }

    // Utility methods for DevOps
    generateDockerfileName(applicationName: string): string {
        return `Dockerfile.${applicationName.toLowerCase()}`;
    }

    generateDockerComposeFileName(): string {
        return 'docker-compose.yml';
    }

    generateKubernetesFileName(resourceType: string, applicationName: string): string {
        return `${resourceType}-${applicationName.toLowerCase()}.yml`;
    }

    generateTerraformFileName(resourceType: string): string {
        return `${resourceType}.tf`;
    }

    generateEnvironmentFileName(environment: string): string {
        return `.env.${environment}`;
    }

    generateCIFileName(platform: string): string {
        const ciFiles: { [key: string]: string } = {
            'github': '.github/workflows/deploy.yml',
            'gitlab': '.gitlab-ci.yml',
            'jenkins': 'Jenkinsfile',
            'circleci': '.circleci/config.yml'
        };
        return ciFiles[platform.toLowerCase()] || '.github/workflows/deploy.yml';
    }

    // Deployment utility methods
    generateDeploymentScript(platform: string, application: any): string {
        switch (platform.toLowerCase()) {
            case 'vercel':
                return this.generateVercelDeploymentScript(application);
            case 'docker':
                return this.generateDockerDeploymentScript(application);
            case 'kubernetes':
                return this.generateKubernetesDeploymentScript(application);
            default:
                return this.generateGenericDeploymentScript(application);
        }
    }

    private generateVercelDeploymentScript(application: any): string {
        return `#!/bin/bash
# Vercel Deployment Script for ${application.name}

echo "🚀 Deploying ${application.name} to Vercel..."

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    npm install -g vercel
fi

# Deploy to Vercel
vercel --prod --yes

echo "✅ Deployment completed successfully!"`;
    }

    private generateDockerDeploymentScript(application: any): string {
        return `#!/bin/bash
# Docker Deployment Script for ${application.name}

echo "🐳 Deploying ${application.name} with Docker..."

# Build the Docker image
docker build -t ${application.name.toLowerCase()}:latest .

# Run the container
docker run -d -p 3000:3000 --name ${application.name.toLowerCase()}-app ${application.name.toLowerCase()}:latest

echo "✅ Docker deployment completed successfully!"`;
    }

    private generateKubernetesDeploymentScript(application: any): string {
        return `#!/bin/bash
# Kubernetes Deployment Script for ${application.name}

echo "☸️ Deploying ${application.name} to Kubernetes..."

# Apply Kubernetes manifests
kubectl apply -f k8s/

# Wait for deployment to be ready
kubectl wait --for=condition=available --timeout=300s deployment/${application.name.toLowerCase()}

echo "✅ Kubernetes deployment completed successfully!"`;
    }

    private generateGenericDeploymentScript(application: any): string {
        return `#!/bin/bash
# Generic Deployment Script for ${application.name}

echo "🚀 Deploying ${application.name}..."

# Add your deployment logic here
# This is a template that should be customized for your specific needs

echo "✅ Deployment completed successfully!"`;
    }
}
