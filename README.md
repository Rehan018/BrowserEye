# BrowserEye 🤖

An AI-powered Chrome extension that provides intelligent browser insights and autonomous web automation capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)

## 🌟 Features

### 🤖 AI-Powered Assistant
- **Agentic AI**: Autonomous task execution with goal decomposition and adaptive planning
- **Multi-LLM Support**: Compatible with OpenAI GPT-4, Anthropic Claude, Google Gemini, and Ollama
- **Context Awareness**: Understands current page content and browser state
- **Memory System**: Learns from interactions to improve future performance

### 🌐 Browser Automation
- **Smart Navigation**: Navigate to URLs and search Google intelligently
- **Element Interaction**: Click elements, fill forms, and simulate key presses
- **Content Extraction**: Get page content in markdown format for analysis
- **Tab Management**: Switch between tabs and manage browser history
- **Screenshot Capture**: Take screenshots for visual context and debugging

### 📊 Intelligent Analysis
- **Page Summarization**: AI-powered content analysis and summarization
- **Document Processing**: Handle PDFs and other document formats
- **Research Assistant**: Organize and analyze web research efficiently
- **Citation Management**: Automatic source tracking and referencing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Chrome browser (version 88+)
- API keys for your preferred AI provider

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/browsereye.git
cd browsereye
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the extension**
```bash
npm run build
```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" and select the `dist` folder
   - Pin the BrowserEye extension to your toolbar

## ⚙️ Configuration

### AI Provider Setup

Configure your preferred AI provider in the extension settings:

#### OpenAI
```javascript
{
  "provider": "openai",
  "apiKey": "sk-your-api-key",
  "model": "gpt-4"
}
```

#### Anthropic Claude
```javascript
{
  "provider": "anthropic", 
  "apiKey": "sk-ant-your-api-key",
  "model": "claude-3-sonnet-20240229"
}
```

#### Google Gemini
```javascript
{
  "provider": "gemini",
  "apiKey": "your-gemini-api-key", 
  "model": "gemini-pro"
}
```

#### Ollama (Local)
```javascript
{
  "provider": "ollama",
  "endpoint": "http://localhost:11434",
  "model": "llama2"
}
```

## 🎯 Usage

### Basic Chat
1. Click the BrowserEye icon or use `Ctrl+Shift+U`
2. Ask questions about the current page or request web automation
3. The AI will analyze content and perform actions as needed

### Example Commands
```
"Summarize this page"
"Search for React tutorials on Google"
"Fill out this form with my information"
"Navigate to GitHub and find trending repositories"
"Compare prices for laptops across multiple sites"
"Find job openings for software engineers in India"
```

### Autonomous Mode
Enable autonomous mode for complex multi-step tasks:
- The AI breaks down objectives into subtasks
- Executes actions automatically with minimal intervention
- Learns from successes and failures for future improvements

## 🏗️ Development

### Project Structure
```
src/
├── components/          # React UI components
├── lib/                # Core libraries
│   ├── agent.ts        # Main AI agent
│   ├── agentic-agent.ts # Autonomous agent
│   ├── browser-tools.ts # Browser automation
│   └── llm/            # LLM providers
├── hooks/              # React hooks
├── views/              # Main application views
├── types/              # TypeScript definitions
└── background/         # Extension background scripts
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run build:watch  # Build with file watching

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript compiler

# Testing
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite with Chrome Extension plugin
- **State Management**: Zustand
- **AI Integration**: Multiple LLM providers with streaming
- **Browser APIs**: Chrome Extension Manifest V3

## 🔧 Architecture

### Core Components

#### Agent System
The main AI reasoning engine that processes user requests and coordinates tool execution.

#### Agentic Agent  
Advanced autonomous agent with planning capabilities for complex multi-step tasks.

#### Browser Tools
Comprehensive set of browser automation tools for web interaction.

#### Memory System
Learning and pattern recognition system that improves performance over time.

#### Planner
Goal decomposition and task management system for autonomous execution.

### Key Files
- `src/lib/agent.ts` - Core AI agent implementation
- `src/lib/agentic-agent.ts` - Autonomous agent with planning
- `src/lib/browser-tools.ts` - Browser automation tools
- `src/lib/system-prompts.ts` - AI behavior configuration
- `src/components/` - React UI components

## 🔒 Privacy & Security

- **Local Processing**: Sensitive data processed locally when possible
- **Secure Storage**: API keys encrypted in Chrome's secure storage
- **Minimal Permissions**: Only requests necessary browser permissions
- **No Data Collection**: No user data sent to third parties
- **Open Source**: Full transparency with open source code

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📋 Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and improvements:

- [ ] Email automation and management
- [ ] Calendar integration and scheduling
- [ ] Advanced shopping automation
- [ ] Team collaboration features
- [ ] Custom workflow builder
- [ ] Voice command support
- [ ] Mobile companion app

## 🐛 Troubleshooting

### Common Issues

**Extension not loading**
- Ensure Chrome Developer mode is enabled
- Check console for error messages
- Verify all dependencies are installed

**AI not responding**
- Check API key configuration
- Verify internet connection
- Check provider service status

**Automation not working**
- Ensure page is fully loaded
- Check for CAPTCHA or security measures
- Verify element selectors are valid

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)
- [OpenAI API](https://openai.com/api/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Google Gemini](https://ai.google.dev/)
- [Ollama](https://ollama.ai/)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)

## 📞 Support

- 📧 Email: support@browsereye.dev
- 💬 Discord: [Join our community](https://discord.gg/browsereye)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/browsereye/issues)
- 📖 Docs: [Documentation](https://docs.browsereye.dev)

---

Made with ❤️ by the BrowserEye team