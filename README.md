# VibeCaas.ai

<p align="center">
  <img src="media/VibeCaaSLogo.png" alt="VibeCaas Logo" width="360" />
  <br/>
  <em>VibeCaas.ai — Local, voice-enabled AI coding assistant for VS Code & Cursor</em>
  <br/>
</p>

VibeCaas.ai is a powerful, voice-enabled AI coding assistant that runs fully locally using Ollama models. Keep your code private while boosting productivity with brainstorming (Vibe Mode), code generation (Code Mode), and an interactive chat sidebar.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![VS Code Extension](https://img.shields.io/badge/VS%20Code%20Extension-VibeCaas.ai-6c43f3)](#)
[![Built with Ollama](https://img.shields.io/badge/Built%20with-Ollama-000)](https://ollama.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![VS Code API](https://img.shields.io/badge/VS%20Code%20API-1.80+-green)](https://code.visualstudio.com/api)

## ✨ Features

### 🎯 **Core AI Capabilities**
- **Code Generation**: Generate idiomatic, well-documented code from natural language
- **Planning & Architecture**: Create step-by-step implementation plans and system designs
- **Debug & Review**: Identify potential errors and suggest fixes for selected code
- **Multi-Agent System**: Specialized AI agents working together for complex projects

### 🎤 **Voice-First Experience**
- **Speech-to-Text**: Open-source Vosk integration for hands-free coding
- **Voice Commands**: Natural language voice input for all features
- **Audio Feedback**: Visual and audio cues for voice mode status

### 🏗️ **Advanced Project Features**
- **Application Scaffolding**: Generate complete applications from descriptions
- **Multi-File Generation**: Create entire project structures with dependencies
- **Git Integration**: Summarize diffs and generate commit messages
- **Safe Operations**: Confirmation prompts for all file write operations

### 🎨 **User Interface**
- **Interactive Chat**: Rich sidebar chat interface with markdown support
- **Tools Panel**: Dedicated tools view for specialized operations
- **Status Bar**: Real-time Ollama status and model information
- **Responsive Design**: Modern, accessible UI with keyboard shortcuts

## 🚀 Quick Start

### Prerequisites
- **VS Code 1.80+** or **Cursor (latest)**
- **Ollama v0.1.0+** installed and running
- **16GB+ RAM** recommended (32GB for larger models)
- **Optional**: Vosk model + microphone for Voice Mode

### Installation

1. **Install Ollama and verify:**
   ```bash
   ollama --version
   ```

2. **Install the extension:**
   - **From Marketplace**: Search for "VibeCaas.ai"
   - **Build locally**:
     ```bash
     npm install
     npm run compile
     npx vsce package
     code --install-extension vibecaas-ai-*.vsix
     ```

3. **Configure settings** (Preferences → Settings):
   - `vibecaas.ollamaUrl` (default: `http://localhost:11434`)
   - `vibecaas.defaultModel` (e.g., `qwen2.5-coder:7b`)
   - `vibecaas.enableVoice` and `vibecaas.voskModelPath` (optional)

### Voice Mode Setup (Optional)

Voice Mode uses [Vosk](https://alphacephei.com/vosk/) for local speech recognition.

1. **Install dependencies:**
   ```bash
   npm install vosk node-record-lpcm16
   ```

2. **Download Vosk model:**
   - Visit [https://alphacephei.com/vosk/models](https://alphacephei.com/vosk/models)
   - Download a small English model (e.g., `vosk-model-small-en-us-0.15`)
   - Extract and set `vibecaas.voskModelPath` to the model folder

3. **Platform-specific setup:**
   - **macOS**: `brew install sox` or ensure CoreAudio is available
   - **Linux**: Uses ALSA by default
   - **Windows**: Install SoX or use built-in audio tools

## 🎮 Usage

### **Sidebar Interface**
- Click the VibeCaas.ai icon to open the chat panel
- Use the Tools view for specialized operations
- Switch between Vibe Mode (planning) and Code Mode (generation)

### **Keyboard Shortcuts**
- **Generate Code**: `Ctrl/Cmd + Alt + G`
- **Open Chat**: `Ctrl/Cmd + Alt + C`
- **Generate Plan**: `Ctrl/Cmd + Alt + P`
- **Toggle Voice Mode**: Available in command palette

### **Commands Palette**
- `VibeCaas.ai: Generate Code` - Create code from description
- `VibeCaas.ai: Generate Plan` - Create implementation plan
- `VibeCaas.ai: Debug Selection` - Analyze selected code
- `VibeCaas.ai: Open Chat` - Focus chat interface
- `VibeCaas.ai: Toggle Voice Mode` - Enable/disable voice input
- `VibeCaas.ai: Change Model` - Switch Ollama models
- `VibeCaas.ai: Pull Model` - Download new models
- `VibeCaas.ai: Scaffold from Prompt` - Generate complete applications

### **Example Workflow**

1. **Plan Your Project:**
   ```
   "Plan a Python FastAPI REST API with user authentication"
   ```

2. **Generate Code:**
   ```
   "Write a FastAPI user creation endpoint with validation"
   ```

3. **Debug & Improve:**
   Select code and ask: "Explain this" or "Find potential issues"

4. **Create Complete Apps:**
   ```
   "Create a full-stack todo app with React frontend and Node.js backend"
   ```

## ⚙️ Configuration

### **Core Settings**
```json
{
  "vibecaas.ollamaUrl": "http://localhost:11434",
  "vibecaas.defaultModel": "qwen2.5-coder:7b",
  "vibecaas.enableVoice": false,
  "vibecaas.voskModelPath": "",
  "vibecaas.mode": "code"
}
```

### **Advanced Options**
```json
{
  "vibecaas.maxContextBytes": 200000,
  "vibecaas.enableDebug": false,
  "vibecaas.scaffold.maxFiles": 20,
  "vibecaas.scaffold.maxTotalBytes": 400000,
  "vibecaas.scaffold.allowOverwrite": false
}
```

### **Prompt Templates**
```json
{
  "vibecaas.promptTemplates": {
    "debug": "Identify potential errors or edge cases in the following code and suggest fixes.",
    "plan": "Create a step-by-step implementation plan for the following task.",
    "generate": "Generate idiomatic, well-documented code for the following request."
  }
}
```

## 🤖 Recommended Models

### **Fast & Efficient**
- `qwen2.5-coder:7b` - Excellent code generation, 16GB RAM
- `codellama:7b` - Good balance of speed and quality

### **High Quality**
- `codellama:13b` - Superior code generation, 32GB RAM
- `qwen2.5-coder:14b` - Advanced reasoning, 32GB RAM

### **General Purpose**
- `mistral:7b` - Good reasoning and planning
- `llama3.1:8b` - Balanced performance

## 🔒 Security & Privacy

- **100% Local**: All AI inference runs on your machine via Ollama
- **No Cloud Dependencies**: Your code never leaves your system
- **Voice Privacy**: Speech recognition happens locally with Vosk
- **Safe Operations**: Write operations require explicit confirmation
- **Open Source**: Transparent codebase for security review

## 🛠️ Development

### **Building from Source**
```bash
# Clone the repository
git clone https://github.com/ttracx/vibeCaas_ollama_vsextension.git
cd vibeCaas_ollama_vsextension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Package extension
npm run package

# Launch Extension Development Host
F5 in VS Code
```

### **Project Structure**
```
src/
├── agents/           # AI agent system
├── commands.ts       # Command implementations
├── extension.ts      # Main extension entry point
├── ollamaClient.ts   # Ollama API client
├── chatViewProvider.ts # Chat interface
├── toolsViewProvider.ts # Tools panel
├── voiceSession.ts   # Voice processing
├── scaffold.ts       # Project generation
└── utils/            # Utility functions
```

### **Testing**
```bash
npm run compile && npm test
```

## 🐛 Troubleshooting

### **Common Issues**

**Ollama Connection Failed**
- Ensure Ollama is running: `ollama serve`
- Check `vibecaas.ollamaUrl` in settings
- Verify firewall/network configuration

**Voice Mode Not Working**
- Install optional dependencies: `npm install vosk node-record-lpcm16`
- Set valid `vibecaas.voskModelPath`
- Check microphone permissions
- Ensure audio tools are installed (SoX, CoreAudio, ALSA)

**Performance Issues**
- Use smaller models for limited RAM
- Reduce `vibecaas.maxContextBytes`
- Close unnecessary VS Code extensions
- Ensure adequate system resources

**Model Pull Failures**
- Check internet connection
- Verify model name format (e.g., `codellama:13b`)
- Ensure sufficient disk space
- Check Ollama logs: `ollama logs`

### **Debug Mode**
Enable verbose logging:
```json
{
  "vibecaas.enableDebug": true
}
```

## 📚 API Reference

### **OllamaClient Methods**
- `generate(request, onToken?)` - Generate text with optional streaming
- `chat(model, messages, onToken?)` - Chat completion with streaming
- `listModels()` - Get available models
- `pullModel(name, onProgress?)` - Download model with progress

### **Agent System**
- **ArchitectAgent**: System design and architecture
- **BackendAgent**: API and backend development
- **FrontendAgent**: UI/UX and frontend code
- **DevOpsAgent**: Deployment and infrastructure

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.com) for local AI inference
- [Vosk](https://alphacephei.com/vosk/) for speech recognition
- [VS Code](https://code.visualstudio.com/) for the extension platform
- The open-source community for inspiration and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ttracx/vibeCaas_ollama_vsextension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ttracx/vibeCaas_ollama_vsextension/discussions)
- **Documentation**: [Wiki](https://github.com/ttracx/vibeCaas_ollama_vsextension/wiki)

---

**Made with ❤️ by the VibeCaas.ai team**

*Empowering developers with local, private AI assistance.*

