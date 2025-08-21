# Contributing to BrowserEye 🤝

Thank you for your interest in contributing to BrowserEye! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Development Standards](#development-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@browsereye.dev](mailto:conduct@browsereye.dev).

### Our Standards

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with newcomers
- **Focus on what's best** for the community
- **Show empathy** towards other community members

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Chrome browser (latest version)
- Code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/yourusername/browsereye.git
cd browsereye
```

3. Add the original repository as upstream:
```bash
git remote add upstream https://github.com/originalowner/browsereye.git
```

## 🛠️ Development Setup

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build extension
npm run build
```

### Environment Setup

1. Copy environment template:
```bash
cp .env.example .env
```

2. Configure your API keys in `.env`:
```env
VITE_OPENAI_API_KEY=your_openai_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key
VITE_GEMINI_API_KEY=your_gemini_key
```

### Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder

## 📝 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🧪 **Tests**
- 🎨 **UI/UX improvements**
- 🔧 **Performance optimizations**
- 🌐 **Translations**

### Before You Start

1. **Check existing issues** to avoid duplicates
2. **Create an issue** for major changes to discuss approach
3. **Keep changes focused** - one feature/fix per PR
4. **Follow coding standards** outlined below

## 🔄 Pull Request Process

### 1. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new functionality
- Update documentation as needed

### 3. Commit Changes

Use conventional commit messages:

```bash
# Feature
git commit -m "feat: add autonomous web navigation"

# Bug fix
git commit -m "fix: resolve memory leak in agent system"

# Documentation
git commit -m "docs: update API documentation"

# Refactor
git commit -m "refactor: improve error handling"
```

### 4. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Create a pull request with:
- **Clear title** describing the change
- **Detailed description** of what and why
- **Screenshots** for UI changes
- **Testing instructions**
- **Related issue links**

### 5. PR Review Process

- Automated checks must pass
- At least one maintainer review required
- Address feedback promptly
- Keep PR updated with main branch

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Clear description** of the issue
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (Chrome version, OS, etc.)
- **Screenshots/videos** if applicable
- **Console errors** if any

### Feature Requests

Use the feature request template and include:

- **Problem description**
- **Proposed solution**
- **Alternative solutions considered**
- **Use cases and benefits**

## 🎯 Development Standards

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper type annotations
- Avoid `any` type unless absolutely necessary

```typescript
// Good
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
}

// Avoid
const preferences: any = { theme: 'light' };
```

### React Guidelines

- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript for prop types
- Follow React best practices

```typescript
// Good
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, disabled, children }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── features/       # Feature-specific components
├── lib/                # Core business logic
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── constants/          # Application constants
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests

- Write unit tests for utilities and hooks
- Write integration tests for components
- Write E2E tests for critical user flows

```typescript
// Example unit test
import { describe, it, expect } from 'vitest';
import { formatTime } from '../utils/time';

describe('formatTime', () => {
  it('should format time correctly', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    expect(formatTime(date)).toBe('12:00 PM');
  });
});
```

### Test Coverage

Maintain minimum 80% test coverage for:
- Utility functions
- Custom hooks
- Core business logic

## 📚 Documentation

### Code Documentation

- Use JSDoc for functions and classes
- Write clear comments for complex logic
- Keep README files updated

```typescript
/**
 * Executes a browser automation task with retry logic
 * @param task - The task to execute
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise resolving to task result
 */
async function executeTask(task: Task, maxRetries = 3): Promise<TaskResult> {
  // Implementation
}
```

### Documentation Updates

When making changes, update relevant documentation:
- README.md for user-facing changes
- API documentation for new features
- Code comments for complex logic
- CHANGELOG.md for releases

## 🏷️ Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Changelog

Update CHANGELOG.md with:
- New features
- Bug fixes
- Breaking changes
- Deprecations

## 🎉 Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Annual contributor highlights

## 📞 Getting Help

Need help contributing? Reach out:

- 💬 **Discord**: [Join our community](https://discord.gg/browsereye)
- 📧 **Email**: [dev@browsereye.dev](mailto:dev@browsereye.dev)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/browsereye/issues)
- 📖 **Docs**: [Developer Documentation](https://docs.browsereye.dev/contributing)

## 📄 License

By contributing to BrowserEye, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to BrowserEye! 🚀