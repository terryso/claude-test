# claude-test

[![npm version](https://badge.fury.io/js/claude-test.svg)](https://badge.fury.io/js/claude-test)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

YAML-based Playwright MCP testing framework for Claude Code. Easily initialize, manage, and update your testing framework in any project.

## Installation

```bash
npm install -g claude-test
```

## Quick Start

1. **Initialize framework in your project:**
   ```bash
   claude-test init
   ```

2. **Run your first test:**
   ```bash
   /run-yaml-test
   ```

3. **Check framework status:**
   ```bash
   claude-test check
   ```

## Commands

### `claude-test init`

Initialize the testing framework in your current project directory.

```bash
claude-test init [options]
```

**Options:**
- `-f, --force` - Force initialization even if framework already exists
- `--verbose` - Show detailed output during initialization

**Example:**
```bash
# Basic initialization
claude-test init

# Force reinitialize with detailed output
claude-test init --force --verbose
```

### `claude-test update`

Update the framework to the latest version.

```bash
claude-test update [options]
```

**Options:**
- `--backup` - Create backup before update
- `--dry-run` - Show what would be updated without making changes
- `--verbose` - Show detailed output

**Example:**
```bash
# Update with backup
claude-test update --backup

# Preview changes without applying
claude-test update --dry-run

# Detailed update process
claude-test update --verbose
```

### `claude-test check`

Check framework version and status.

```bash
claude-test check [options]
```

**Options:**
- `--remote` - Check for remote updates (future feature)
- `--fix` - Attempt to fix integrity issues automatically
- `--verbose` - Show detailed output

**Example:**
```bash
# Basic status check
claude-test check

# Check and fix issues
claude-test check --fix

# Detailed status report
claude-test check --verbose
```

## Framework Features

After initialization, your project will have a complete testing framework with:

- 🌍 **Multi-Environment Support**: Support for dev/test/prod environments
- 📚 **Reusable Step Libraries**: Modular and reusable test components
- 🗣️ **Natural Language**: Write tests in natural language descriptions
- 🔧 **Environment Variables**: Automatic configuration loading from .env files
- 📊 **Smart Reporting**: Beautiful HTML test reports with embedded data
- ⚡ **Session Persistence**: Faster test execution with persistent browser sessions
- 🚀 **CLI Management**: Easy installation, updates, and integrity checking

## Project Structure

After running `claude-test init`, your project will contain:

```
.claude/
├── commands/                     # Claude Code commands
│   ├── run-yaml-test.md         # Execute individual tests
│   ├── run-test-suite.md        # Execute test suites  
│   ├── validate-yaml-test.md    # Validate test syntax
│   ├── validate-test-suite.md   # Validate suite syntax
│   └── view-reports-index.md    # View test reports
└── scripts/                     # Framework automation scripts
    ├── yaml-test-processor.js   # YAML test processing engine
    ├── create-report-data.js    # Report data creation (Step 1)
    ├── gen-report.js           # HTML report generation (Step 2)
    ├── scan-reports.js         # Report indexing and organization
    ├── start-report-server.js  # Local HTTP server for reports
    └── suite-report-generator.js # Test suite report generator
```

## Version Management

The CLI automatically manages framework versions:

- **Installation tracking**: Records when and how the framework was installed
- **Version compatibility**: Ensures CLI and framework versions are compatible
- **Automatic updates**: Updates framework files while preserving customizations
- **Integrity checking**: Verifies all required files are present and valid
- **Backup support**: Optional backup creation before updates

## Requirements

- **Node.js**: >= 16.0.0
- **Claude Code**: With Playwright MCP integration
- **NPM**: For global installation

## Development and Testing

The framework includes comprehensive testing and validation:

- **352 tests** covering all core functionality
- **81%+ code coverage** ensuring reliability
- **Automated YAML processing** for efficient test execution
- **Two-step report generation** for clean data separation

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## Support

For issues and questions:

- **GitHub Issues**: [Report a bug](https://github.com/anthropics/claude-test/issues)
- **Documentation**: [Full Documentation](https://github.com/anthropics/claude-test#readme)
- **Claude Code Docs**: [https://docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by the Anthropic team for the Claude Code community.**