# Contributing to claude-test

Thank you for your interest in contributing to claude-test! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- Git

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/anthropics/claude-test.git
   cd claude-test
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run tests**:
   ```bash
   npm test
   npm run test:coverage
   ```

4. **Run linting**:
   ```bash
   npm run lint
   npm run lint:fix
   ```

5. **Test CLI locally**:
   ```bash
   npm pack
   npm install -g ./claude-test-*.tgz
   claude-test --version
   ```

## Code Quality Standards

### Linting and Formatting

- **ESLint**: Code must pass ESLint checks
- **Jest**: All tests must pass with >= 80% coverage
- **Code Style**: Follow existing code patterns and conventions

### Testing Requirements

- **Unit Tests**: All new functions must have unit tests
- **Integration Tests**: CLI commands must have integration tests
- **Coverage**: Maintain >= 80% test coverage
- **Cross-Platform**: Tests must pass on macOS and Linux

### Pre-commit Checks

The following checks run automatically before each commit:
- ESLint validation
- Jest test suite
- Coverage threshold validation

## Release Process

### Version Management

We follow [Semantic Versioning (SemVer)](https://semver.org/):

- **PATCH** (1.0.1): Bug fixes and minor improvements
- **MINOR** (1.1.0): New features that are backward compatible
- **MAJOR** (2.0.0): Breaking changes

### Release Commands

```bash
# Patch release (bug fixes)
npm run release:patch

# Minor release (new features)
npm run release:minor

# Major release (breaking changes)
npm run release:major
```

### Automated Release Process

1. **Create a tag**: Push a tag in format `v1.2.3`
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

2. **GitHub Actions**: Automatically runs:
   - Full test suite across Node.js versions 16, 18, 20
   - Cross-platform testing (Ubuntu, Windows, macOS)
   - Security audit
   - CLI functionality verification
   - NPM package publishing
   - GitHub release creation

3. **Manual Verification**: After release:
   ```bash
   npm install -g claude-test@latest
   claude-test --version
   claude-test --help
   ```

## Pull Request Guidelines

### Before Submitting

1. **Run all checks locally**:
   ```bash
   npm run ci
   ```

2. **Update tests**: Add/update tests for any new functionality

3. **Update documentation**: Update README.md and command files as needed

4. **Check dependencies**: Ensure no unnecessary dependencies are added

### PR Requirements

- **Descriptive title**: Clearly describe what the PR does
- **Detailed description**: Explain the changes and why they're needed
- **Tests included**: All new code must be tested
- **Documentation updated**: Update docs for user-facing changes
- **Breaking changes**: Clearly mark any breaking changes

### PR Process

1. **Fork and branch**: Create a feature branch from `master`
2. **Make changes**: Implement your changes with tests
3. **Test thoroughly**: Run the full test suite
4. **Submit PR**: Create a pull request to `master` branch
5. **Code review**: Address feedback from maintainers
6. **Merge**: PR will be merged after approval and CI passes

## CI/CD Pipeline

### Continuous Integration

**On every push and PR**:
- **Multi-platform testing**: Ubuntu, macOS
- **Multi-version testing**: Node.js 16.x, 18.x, 20.x
- **Code quality checks**: Linting, testing, coverage
- **Security audit**: npm audit for vulnerabilities
- **CLI testing**: Verify CLI installation and basic functionality

### Continuous Deployment

**On tagged releases**:
- **Pre-publish validation**: Full test suite and linting
- **NPM publishing**: Automatic publication to npm registry
- **GitHub releases**: Automatic release notes generation
- **Documentation updates**: Auto-generated changelog

### Security

**Dependabot integration**:
- **Weekly dependency updates**: Automated PR creation
- **Security updates**: Immediate PRs for security vulnerabilities
- **Auto-merge**: Patch and minor updates auto-merged after tests pass

## Issue Guidelines

### Bug Reports

Please include:
- **Node.js version**: `node --version`
- **npm version**: `npm --version`
- **Operating system**: macOS/Linux
- **claude-test version**: `claude-test --version`
- **Error message**: Full error output
- **Steps to reproduce**: Clear reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens

### Feature Requests

Please include:
- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other approaches you've considered
- **Additional context**: Any other relevant information

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Please be respectful and professional in all interactions.

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check README.md and command documentation first

## License

By contributing to claude-test, you agree that your contributions will be licensed under the MIT License.