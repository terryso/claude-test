# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `claude-test`, a YAML-based Playwright testing framework CLI for Claude Code. It's an npm package that provides commands to initialize, update, and manage a testing framework in user projects.

## Key Commands

- **Test**: `npm test` - Run Jest test suite
- **Test with Coverage**: `npm run test:coverage` - Run tests with coverage reports
- **Test Watch Mode**: `npm run test:watch` - Run tests in watch mode for development
- **Lint**: `npm run lint` - Run ESLint on lib/, bin/, and test/ directories
- **Pre-publish**: `npm run prepack` - Runs tests before publishing

## Architecture

### Core Components

- **CLI Entry Point**: `bin/claude-test.js` - Commander.js-based CLI with three main commands (init, update, check)
- **Commands**: `lib/commands/` - Contains implementation for each CLI command
  - `init.js` - Initializes framework in target projects by copying templates
  - `update.js` - Updates existing framework installations
  - `check.js` - Validates framework integrity and versions
- **Utilities**: `lib/utils/` - Core business logic
  - `file-manager.js` - Handles all file operations, copying, integrity checks
  - `version-manager.js` - Manages version tracking and compatibility
- **Templates**: `lib/templates/` - Framework files that get copied to user projects

### Framework Structure

When initialized in a user project, creates `.claude/` directory with:
- `commands/` - Claude Code command files (.md format)
- `scripts/` - JavaScript automation scripts for test processing and reporting
- `.framework-version` - Version tracking file

### Key Features

- **Version Management**: Tracks CLI version vs framework version in user projects
- **Integrity Checking**: Validates all required files are present and valid
- **Update Safety**: Preserves user customizations during updates
- **Backup Support**: Optional backup creation before updates
- **Progress Feedback**: Ora spinners and detailed verbose output

### Testing

- Jest test framework with 80% coverage threshold
- Tests located in `test/` directory matching `*.test.js` pattern
- Coverage excludes template files in `lib/templates/`
- HTML coverage reports generated in `coverage/` directory

### Dependencies

- **Production**: commander, fs-extra, semver, chalk, ora
- **Development**: jest, eslint
- **Node.js**: Requires >= 16.0.0

## Development Notes

- Templates are stored in `lib/templates/.claude/` and copied to user projects
- File operations use fs-extra for enhanced filesystem capabilities
- CLI uses chalk for colored output and ora for progress indicators
- Version compatibility managed through semver package