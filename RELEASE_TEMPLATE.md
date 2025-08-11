# Release Template for VibeCaas.ai

## Release Information

**Version**: [VERSION] (e.g., 0.1.1)  
**Release Date**: [DATE] (e.g., 2024-08-10)  
**Release Type**: [Major/Minor/Patch]  
**VS Code API**: 1.80+  

## 🎉 What's New

### ✨ New Features
- [Feature 1 description]
- [Feature 2 description]
- [Feature 3 description]

### 🔧 Improvements
- [Improvement 1 description]
- [Improvement 2 description]
- [Improvement 3 description]

### 🐛 Bug Fixes
- [Bug fix 1 description]
- [Bug fix 2 description]
- [Bug fix 3 description]

### 📚 Documentation
- [Documentation update 1]
- [Documentation update 2]

## 🚀 Installation

### From VSIX Package
1. Download the `vibecaas-ai-[VERSION].vsix` file
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click the "..." menu and select "Install from VSIX..."
4. Choose the downloaded file and install

### From Source
```bash
git clone https://github.com/ttracx/vibeCaas_ollama_vsextension.git
cd vibeCaas_ollama_vsextension
git checkout v[VERSION]
npm install
npm run compile
npm run package
```

## 🔧 Requirements

- **VS Code**: 1.80+ or Cursor (latest)
- **Ollama**: v0.1.0+ installed and running
- **RAM**: 16GB+ recommended (32GB for larger models)
- **Optional**: Vosk model + microphone for Voice Mode

## 📋 Breaking Changes

> ⚠️ **Note**: This release includes breaking changes that may affect existing configurations.

- [Breaking change 1]
- [Breaking change 2]

### Migration Guide
[Provide step-by-step migration instructions if needed]

## 🔄 Migration from Previous Version

### Automatic Migration
[Describe any automatic migration processes]

### Manual Steps Required
1. [Step 1]
2. [Step 2]
3. [Step 3]

## 🧪 Testing

### Tested Environments
- ✅ Windows 10/11
- ✅ macOS 12+ (Intel/Apple Silicon)
- ✅ Ubuntu 20.04+
- ✅ VS Code 1.80+
- ✅ Cursor (latest)

### Tested Ollama Models
- ✅ qwen2.5-coder:7b
- ✅ codellama:7b
- ✅ codellama:13b
- ✅ mistral:7b

## 📊 Performance Metrics

- **Extension Size**: [SIZE] MB
- **Compilation Time**: [TIME] seconds
- **Memory Usage**: [MEMORY] MB average
- **Response Time**: [TIME] ms average

## 🔍 Known Issues

- [Known issue 1 with workaround]
- [Known issue 2 with workaround]

## 🚀 What's Next

### Upcoming Features (v[NEXT_VERSION])
- [Upcoming feature 1]
- [Upcoming feature 2]
- [Upcoming feature 3]

### Roadmap
- [Q1 2024]: [Feature category]
- [Q2 2024]: [Feature category]
- [Q3 2024]: [Feature category]

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Report Issues
- **Bug Reports**: [GitHub Issues](https://github.com/ttracx/vibeCaas_ollama_vsextension/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/ttracx/vibeCaas_ollama_vsextension/discussions)
- **Security Issues**: [Security Policy](SECURITY.md)

## 📚 Resources

- **Documentation**: [README.md](README.md)
- **API Reference**: [CHANGELOG.md](CHANGELOG.md)
- **Community**: [GitHub Discussions](https://github.com/ttracx/vibeCaas_ollama_vsextension/discussions)
- **Wiki**: [Project Wiki](https://github.com/ttracx/vibeCaas_ollama_vsextension/wiki)

## 🙏 Acknowledgments

Special thanks to our contributors and the open-source community:

- [Contributor 1] - [Contribution]
- [Contributor 2] - [Contribution]
- [Contributor 3] - [Contribution]

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Release Assets

### VSIX Package
- **File**: `vibecaas-ai-[VERSION].vsix`
- **Size**: [SIZE] MB
- **SHA256**: [HASH]

### Source Code
- **Archive**: `vibecaas-ai-[VERSION].tar.gz`
- **Size**: [SIZE] MB
- **SHA256**: [HASH]

### Checksums
```
SHA256 (vibecaas-ai-[VERSION].vsix) = [HASH]
SHA256 (vibecaas-ai-[VERSION].tar.gz) = [HASH]
```

---

**Made with ❤️ by the VibeCaas.ai team**

*Empowering developers with local, private AI assistance.*
