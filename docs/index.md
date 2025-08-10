# VibeCaas.ai

<img src="../media/VibeCaaSLogo.png" alt="VibeCaas Logo" width="360" />

VibeCaas.ai is a voice-enabled, AI-powered coding assistant for VS Code and Cursor. It runs fully locally using Ollama models, keeping your code private while boosting productivity with brainstorming (Vibe Mode), code generation (Code Mode), and an interactive chat sidebar.

## Install

- Download the latest VSIX from the Releases page and install in VS Code/Cursor
- Or search the Marketplace for "VibeCaas.ai"

## Getting Started

1. Ensure Ollama is running locally
2. Set `vibecaas.ollamaUrl` and select a default model (e.g., `qwen2.5-coder:7b`)
3. Open the VibeCaas.ai sidebar
4. Use chips (Plan, Debug, Explain), or type a prompt

### Voice Mode (optional)

- Install `vosk` and `node-record-lpcm16` (native deps)
- Download a Vosk model and set `vibecaas.voskModelPath`

## Links

- Repository: https://github.com/ttracx/vibeCaas_ollama_vsextension
- Issues: https://github.com/ttracx/vibeCaas_ollama_vsextension/issues
