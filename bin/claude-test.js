#!/usr/bin/env node

/**
 * claude-test CLI Entry Point
 * YAML-based Playwright testing framework for Claude Code
 */

const { Command } = require('commander');
const chalk = require('chalk');
const { version } = require('../package.json');

const program = new Command();

program
  .name('claude-test')
  .description('YAML-based Playwright testing framework for Claude Code')
  .version(version, '-v, --version', 'Output the current version');

// Init command
program
  .command('init')
  .description('Initialize testing framework in current project')
  .option('-f, --force', 'Force initialization even if framework already exists')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const initCommand = require('../lib/commands/init');
      await initCommand(options);
    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Update command
program
  .command('update')
  .description('Update framework to latest version')
  .option('--backup', 'Create backup before update')
  .option('--dry-run', 'Show what would be updated without making changes')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const updateCommand = require('../lib/commands/update');
      await updateCommand(options);
    } catch (error) {
      console.error(chalk.red('❌ Update failed:'), error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Check command
program
  .command('check')
  .description('Check framework version and status')
  .option('--remote', 'Check for remote updates')
  .option('--fix', 'Attempt to fix integrity issues')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const checkCommand = require('../lib/commands/check');
      await checkCommand(options);
    } catch (error) {
      console.error(chalk.red('❌ Check failed:'), error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(
    chalk.red('❌ Invalid command: %s'),
    program.args.join(' ')
  );
  console.log(chalk.gray('Run "claude-test --help" for available commands.'));
  process.exit(1);
});

// Parse CLI arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(chalk.blue('🎯 Claude Test Framework CLI'));
  console.log(chalk.gray('YAML-based Playwright testing for Claude Code\n'));
  program.outputHelp();
}