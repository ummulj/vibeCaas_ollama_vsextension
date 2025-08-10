# VibeCaas.ai

VibeCaas.ai is a voice-enabled, AI-powered coding assistant for VS Code and Cursor. It runs fully locally using Ollama models, keeping your code private while boosting productivity with brainstorming (Vibe Mode), code generation (Code Mode), and an interactive chat sidebar.

## Features

- Voice-first brainstorming (Vibe Mode) using open-source speech-to-text (Vosk)
- Code Mode for voice or text-driven code generation and editing
- Interactive chat panel in the sidebar, with model switching
- Fully local execution via Ollama (no cloud APIs)
- Safe command execution with confirmations for write operations
- Status bar with active model and mode toggle
- Configurable prompt templates and debug logging

## Requirements

- VS Code 1.80+ or Cursor (latest)
- Ollama v0.1.0+ installed and running
- 16GB+ RAM recommended (32GB for larger models)
- Optional (for Voice Mode): Vosk model + microphone utilities

## Installation

1. Install Ollama and verify:

   ```bash
   ollama --version
   ```

2. Install the extension:
   - From Marketplace: search for "VibeCaas.ai"
   - Or build locally:
     ```bash
     npm install
     npm run compile
     npx vsce package
     code --install-extension vibecaas-ai-*.vsix
     ```

3. Configure settings (Preferences → Settings):
   - `vibecaas.ollamaUrl` (default `http://localhost:11434`)
   - `vibecaas.defaultModel` (e.g., `qwen2.5-coder:7b` or `codellama:13b`)
   - `vibecaas.enableVoice` and `vibecaas.voskModelPath` (optional)

### Voice Mode Setup (Optional)

Voice Mode uses [Vosk](https://alphacephei.com/vosk/) and a local microphone recorder.

1. Install dependencies:
   ```bash
   npm install vosk node-record-lpcm16
   ```
2. Download a Vosk model (e.g., small English):
   - See `https://alphacephei.com/vosk/models`
   - Extract the model and set `vibecaas.voskModelPath` to its folder.
3. macOS: you may need audio tools (e.g., `brew install sox`), or ensure CoreAudio is available. Linux uses ALSA.

Tip: Voice Mode is optional and disabled by default. When toggled on, the status bar will show “Listening…” briefly and you’ll hear a short beep on success.

## Usage

- Sidebar: Click the VibeCaas.ai icon to open the chat panel.
- Status Bar: Shows active model and mode. Click to switch model or toggle voice.
- Commands:
- VibeCaas.ai: Generate Code (Ctrl/Cmd + Alt + G)
- VibeCaas.ai: Open Chat (Ctrl/Cmd + Alt + C)
- VibeCaas.ai: Toggle Voice Mode
- VibeCaas.ai: Generate Plan (Ctrl/Cmd + Alt + P)
- VibeCaas.ai: Debug Selection

### Example workflow

1. Open the sidebar and enable Vibe Mode.
2. Say: "Plan a Python FastAPI REST API."
3. A markdown spec is generated in a new file and you receive a visual confirmation.
4. Switch to Code Mode and say: "Write a FastAPI user creation endpoint."
5. The code is generated and copied to your clipboard.
6. Highlight code and ask in chat: "Explain this." The assistant replies based on the selection.

## Settings

- `vibecaas.ollamaUrl`: Ollama base URL
- `vibecaas.defaultModel`: default model
- `vibecaas.enableVoice`: enable/disable voice input
- `vibecaas.voskModelPath`: path to local Vosk model
- `vibecaas.promptTemplates`: customize prompts (debug, plan, generate)
- `vibecaas.maxContextBytes`: cap context size
- `vibecaas.enableDebug`: extra logging

## Models

Recommended:
- `qwen2.5-coder:7b` (fast, 16GB RAM)
- `codellama:13b` (larger, better code generation)
- `mistral:7b` (reasoning/general)

List available models and pull new ones via the command palette:
- "VibeCaas.ai: Change Model"
- "VibeCaas.ai: Pull Ollama Model"

## Security and Privacy

- All AI inference runs locally via Ollama
- Voice data remains on-device
- Write operations require confirmation

## Troubleshooting

- Ollama server not running → Start it and verify `vibecaas.ollamaUrl`
- Voice mode not working → Install optional dependencies and set a valid `vibecaas.voskModelPath`
- Performance issues → Try a smaller model (e.g., `qwen2.5-coder:7b`) and reduce context size

## Development

```bash
npm install
npm run compile
F5 in VS Code to launch Extension Development Host
# Package a VSIX
npx vsce package
```

### Tests

Basic tests are provided using `@vscode/test-electron`.

Run:

```bash
npm run compile && npm test
```

## License

MIT

