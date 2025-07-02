# claude-test

[![npm version](https://badge.fury.io/js/claude-test.svg)](https://badge.fury.io/js/claude-test)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-test.svg)](https://www.npmjs.com/package/claude-test)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-84.95%25-brightgreen.svg)](https://github.com/terryso/claude-test)
[![GitHub Issues](https://img.shields.io/github/issues/terryso/claude-test.svg)](https://github.com/terryso/claude-test/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

🎯 **English** | [中文](README.zh.md)

YAML-based Playwright MCP testing framework CLI for Claude Code. This is the **official CLI package** that allows you to easily initialize, manage, and update a sophisticated testing framework in any project.

> **🚀 What's New**: Revolutionary session persistence, multi-environment support, and smart HTML reporting with 84.95% test coverage.

## Installation

```bash
npm install -g claude-test
```

## Quick Start

### 1. Install globally
```bash
npm install -g claude-test
```

### 2. Initialize in your project
```bash
cd your-project
claude-test init
```

### 3. Create your first test
Create a test file `test-cases/login.yml`:
```yaml
tags: [smoke, login]
steps:
  - "Navigate to {{BASE_URL}}"
  - "Fill username field with {{TEST_USERNAME}}"
  - "Fill password field with {{TEST_PASSWORD}}"
  - "Click login button"
  - "Verify dashboard is displayed"
```

### 4. Set up environment variables
Create `.env.dev`:
```bash
BASE_URL=https://example.com
TEST_USERNAME=testuser
TEST_PASSWORD=testpass123
GENERATE_REPORT=true
REPORT_STYLE=detailed
```

### 5. Run your test
```bash
/run-yaml-test file:login.yml env:dev
```

### 6. View results
```bash
/view-reports-index
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

## Practical Examples

### Example 1: E-commerce Test Suite

**Test Suite** (`test-suites/e-commerce.yml`):
```yaml
name: E-commerce Smoke Tests
description: Critical functionality tests for e-commerce site
tags: [smoke, e-commerce]
test-cases:
  - test-cases/login.yml
  - test-cases/product-search.yml
  - test-cases/add-to-cart.yml
  - test-cases/checkout.yml
```

**Individual Test** (`test-cases/product-search.yml`):
```yaml
tags: [smoke, search]
steps:
  - include: login
  - "Click search field"
  - "Type 'laptop' in search field"
  - "Press Enter"
  - "Verify search results contain 'laptop'"
  - "Verify at least 5 products are displayed"
```

**Step Library** (`steps/login.yml`):
```yaml
description: Standard login flow
steps:
  - "Navigate to {{BASE_URL}}/login"
  - "Fill username field with {{TEST_USERNAME}}"
  - "Fill password field with {{TEST_PASSWORD}}"
  - "Click login button"
  - "Wait for dashboard to load"
```

**Run the suite:**
```bash
/run-test-suite suite:e-commerce.yml env:test
```

### Example 2: Tag-based Test Execution

```bash
# Run all smoke tests
/run-yaml-test tags:smoke env:dev

# Run tests that have both smoke AND login tags
/run-yaml-test tags:smoke,login env:dev

# Run tests that have smoke OR critical tags
/run-yaml-test tags:smoke|critical env:dev

# Run all tests in prod environment
/run-yaml-test env:prod
```

### Example 3: Environment Configuration

**Development** (`.env.dev`):
```bash
BASE_URL=http://localhost:3000
TEST_USERNAME=dev@example.com
TEST_PASSWORD=devpass123
GENERATE_REPORT=true
REPORT_STYLE=overview
REPORT_PATH=reports/dev
```

**Production** (`.env.prod`):
```bash
BASE_URL=https://prod.example.com
TEST_USERNAME=prod@example.com
TEST_PASSWORD=secureprodpass
GENERATE_REPORT=true
REPORT_STYLE=detailed
REPORT_PATH=reports/prod
```

## Frequently Asked Questions

### Q: How do I update my testing framework?
```bash
claude-test update --backup --verbose
```
This creates a backup and shows detailed output during update.

### Q: My test is failing, how do I debug?
1. Check framework integrity: `claude-test check --verbose`
2. Validate your test syntax: `/validate-yaml-test file:your-test.yml`
3. Run with detailed reporting: Set `REPORT_STYLE=detailed` in your .env file
4. Check the generated HTML reports: `/view-reports-index`

### Q: How do I create reusable test steps?
Create YAML files in the `steps/` directory:
```yaml
# steps/common-actions.yml
description: Common UI actions
steps:
  - "Wait for page to load"
  - "Take screenshot"
  - "Scroll to top of page"
```

Then include in your tests:
```yaml
# test-cases/my-test.yml
tags: [smoke]
steps:
  - include: common-actions
  - "Click submit button"
```

### Q: Can I run tests in parallel?
Currently, tests run sequentially with session optimization. Parallel execution is planned for future releases.

### Q: How do I handle different environments?
1. Create separate `.env` files: `.env.dev`, `.env.test`, `.env.prod`
2. Use environment variables in your tests: `{{BASE_URL}}`
3. Specify environment when running: `/run-yaml-test env:prod`

### Q: What if my framework files get corrupted?
```bash
# Check for issues
claude-test check --fix

# Or force reinstall
claude-test init --force
```

### Q: How do I view historical test reports?
1. Run `/view-reports-index`
2. Navigate between environment tabs (dev/test/prod)
3. Click on any report card to view detailed results
4. Reports are organized by timestamp for easy access

## Troubleshooting

### Framework Not Found
```bash
# Error: Framework not found in current directory
claude-test init
```

### Version Mismatch
```bash
# Check versions
claude-test check --verbose

# Update framework
claude-test update
```

### Permission Issues
```bash
# On macOS/Linux, you might need sudo for global install
sudo npm install -g claude-test
```

### Test Execution Fails
1. **Validate test syntax**: `/validate-yaml-test file:your-test.yml`
2. **Check environment variables**: Ensure all `{{VARIABLES}}` are defined
3. **Verify step libraries**: Make sure all `include:` references exist
4. **Check Playwright MCP**: Ensure Claude Code has Playwright integration

## Development and Testing

The framework includes comprehensive testing and validation:

- **CLI Testing**: Complete command validation and integration tests
- **Cross-platform Support**: Tested on macOS and Linux
- **Version Management**: Automatic compatibility checking
- **Error Handling**: Graceful failure modes and recovery

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## CLI Development and Architecture

This project is the **official CLI tool** for the claude-test framework. It contains:

### Core Components
- **CLI Entry Point**: `bin/claude-test.js` - Commander.js-based CLI with three main commands
- **Commands**: `lib/commands/` - Implementation for init, update, and check commands
- **Utilities**: `lib/utils/` - Core business logic (file management, version control)
- **Templates**: `lib/templates/` - Framework files that get copied to user projects

### Development Scripts
- `npm test` - Run Jest test suite with 84.95% code coverage
- `npm run lint` - ESLint validation
- `npm run test:coverage` - Coverage analysis including .claude/scripts
- `npm run sync-templates` - Sync framework templates
- `npm run ci` - Complete CI pipeline

### Testing
Comprehensive test coverage including:
- Unit tests for all core modules
- Integration tests for CLI commands
- Error handling and edge case validation
- CLI command execution testing

## Demo and Usage Examples

For **practical usage examples** and **integration demonstrations**, visit the companion project:

📖 **[claude-test-demo](https://github.com/terryso/claude-code-playwright-mcp-test)** - Complete usage examples, test cases, and integration guides

## Support

For issues and questions:

- **GitHub Issues**: [Report a bug](https://github.com/terryso/claude-test/issues)
- **Full Documentation**: [Full Documentation](https://github.com/terryso/claude-test#readme)
- **Demo Project**: [claude-code-playwright-mcp-test](https://github.com/terryso/claude-code-playwright-mcp-test)
- **Claude Code Docs**: [https://docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=terryso/claude-test&type=Date)](https://www.star-history.com/#terryso/claude-test&Date)

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by the Anthropic team for the Claude Code community.**
