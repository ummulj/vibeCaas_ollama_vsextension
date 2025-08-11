# Contributing to VibeCaas.ai

Thank you for your interest in contributing to VibeCaas.ai! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

We welcome contributions from the community! There are many ways to contribute:

- 🐛 **Bug Reports**: Report bugs and issues
- 💡 **Feature Requests**: Suggest new features and improvements
- 📝 **Documentation**: Improve documentation and examples
- 🔧 **Code Contributions**: Submit pull requests with code improvements
- 🧪 **Testing**: Help test the extension and report issues
- 💬 **Discussions**: Participate in community discussions

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 18+ (LTS recommended)
- **VS Code**: Latest version for extension development
- **Git**: For version control
- **Ollama**: For testing AI functionality

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vibeCaas_ollama_vsextension.git
   cd vibeCaas_ollama_vsextension
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```

4. **Launch Extension Development Host**
   - Open the project in VS Code
   - Press `F5` to launch the Extension Development Host
   - Test your changes in the new VS Code window

## 📋 Development Guidelines

### Code Style

- **TypeScript**: Use strict TypeScript with proper typing
- **Formatting**: Follow existing code formatting and style
- **Comments**: Add JSDoc comments for public APIs
- **Error Handling**: Implement proper error handling and user feedback

### File Organization

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
└── types/            # TypeScript type definitions
```

### Testing

- **Unit Tests**: Add tests for new functionality
- **Integration Tests**: Test extension behavior in VS Code
- **Manual Testing**: Test all features manually before submitting

```bash
# Run tests
npm test

# Compile and test
npm run compile && npm test
```

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Implement your feature or fix
- Add appropriate tests
- Update documentation if needed
- Ensure all tests pass

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

**Commit Message Format:**
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build or tooling changes

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:
- Clear description of changes
- Screenshots for UI changes
- Test results
- Any breaking changes

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Details**
   - VS Code version
   - Extension version
   - Operating system
   - Ollama version

2. **Steps to Reproduce**
   - Clear, step-by-step instructions
   - Sample code or files if relevant

3. **Expected vs Actual Behavior**
   - What you expected to happen
   - What actually happened

4. **Additional Information**
   - Error messages or logs
   - Screenshots if relevant
   - Console output

## 💡 Feature Requests

For feature requests, please:

1. **Describe the Feature**
   - Clear description of what you want
   - Use cases and examples
   - Benefits to users

2. **Consider Implementation**
   - How it might be implemented
   - Any technical considerations
   - Impact on existing features

3. **Provide Context**
   - Why this feature is needed
   - Similar features in other tools
   - User feedback or demand

## 📝 Documentation

We welcome documentation improvements:

- **README Updates**: Clarify setup and usage instructions
- **API Documentation**: Improve code documentation
- **Examples**: Add usage examples and tutorials
- **Troubleshooting**: Expand troubleshooting guides

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test -- --grep "test name"
```

### Test Structure

```
test/
├── suite/            # Test suites
├── index.ts          # Test entry point
└── runTest.ts        # Test runner
```

### Writing Tests

- Test both success and failure cases
- Mock external dependencies
- Test edge cases and error conditions
- Ensure tests are deterministic

## 🔍 Code Review Process

1. **Pull Request Creation**
   - Create a clear, descriptive PR title
   - Provide detailed description of changes
   - Link related issues or discussions

2. **Review Process**
   - Address review comments promptly
   - Make requested changes
   - Update tests if needed
   - Ensure CI checks pass

3. **Merging**
   - PRs require at least one approval
   - All tests must pass
   - No merge conflicts
   - Documentation updated if needed

## 🚨 Breaking Changes

If your contribution includes breaking changes:

1. **Document Changes**
   - Clearly describe what changed
   - Provide migration instructions
   - Update version numbers appropriately

2. **Deprecation Strategy**
   - Deprecate old APIs gradually
   - Provide migration paths
   - Maintain backward compatibility when possible

## 📚 Resources

### Development Tools

- **VS Code Extension API**: [Documentation](https://code.visualstudio.com/api)
- **TypeScript**: [Handbook](https://www.typescriptlang.org/docs/)
- **Ollama**: [API Reference](https://ollama.com/library)
- **Vosk**: [Speech Recognition](https://alphacephei.com/vosk/)

### Community

- **GitHub Issues**: [Report bugs and request features](https://github.com/ttracx/vibeCaas_ollama_vsextension/issues)
- **GitHub Discussions**: [Join community discussions](https://github.com/ttracx/vibeCaas_ollama_vsextension/discussions)
- **Wiki**: [Project documentation](https://github.com/ttracx/vibeCaas_ollama_vsextension/wiki)

## 🎯 Contribution Areas

### High Priority

- **Bug Fixes**: Critical issues affecting functionality
- **Performance**: Optimizations and memory improvements
- **Testing**: Additional test coverage
- **Documentation**: API documentation and examples

### Medium Priority

- **UI Improvements**: Enhanced user experience
- **New Features**: Additional AI capabilities
- **Platform Support**: Extended platform compatibility
- **Accessibility**: Improved accessibility features

### Low Priority

- **Code Refactoring**: Code quality improvements
- **Tooling**: Development tool improvements
- **Examples**: Additional usage examples
- **Translations**: Internationalization support

## 🏆 Recognition

Contributors will be recognized in:

- **README**: Contributors section
- **Releases**: Release notes and changelog
- **GitHub**: Contributor statistics and graphs
- **Community**: Special recognition for significant contributions

## 📄 License

By contributing to VibeCaas.ai, you agree that your contributions will be licensed under the MIT License.

## 🤝 Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search existing issues and discussions
3. Create a new discussion for general questions
4. Contact maintainers for specific guidance

---

**Thank you for contributing to VibeCaas.ai! 🚀**

*Together, we're building the future of local AI-powered development.*
