// const path = require('path'); // Not used currently
const chalk = require('chalk');
const ora = require('ora');
const FileManager = require('../utils/file-manager');
const VersionManager = require('../utils/version-manager');

/**
 * Initialize testing framework in current project
 * @param {Object} options - Command options
 * @param {boolean} options.force - Force initialization even if framework exists
 * @param {boolean} options.verbose - Show detailed output
 */
async function init(options = {}) {
  const spinner = ora('Initializing claude-test framework...').start();
  
  try {
    const currentDir = process.cwd();
    
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      spinner.stop();
      console.log(chalk.blue('🚀 Initializing claude-test framework...'));
      console.log(chalk.gray(`  Target directory: ${currentDir}`));
    }
    
    // Check if framework already exists
    const frameworkExists = await FileManager.isFrameworkExists(currentDir);
    
    if (frameworkExists && !options.force) {
      spinner.stop();
      console.log(chalk.yellow('⚠️  Framework already exists in this directory.'));
      console.log(chalk.gray('Use --force to reinitialize or run "claude-test update" to update.'));
      
      // Show current version info
      const versionInfo = await VersionManager.getVersionInfo(currentDir);
      if (versionInfo) {
        const display = VersionManager.formatVersionDisplay(versionInfo);
        console.log(chalk.gray(`Current version: ${display.current} (installed ${display.installed})`));
      }
      
      return;
    }
    
    if (options.force && frameworkExists) {
      if (options.verbose && process.env.NODE_ENV !== 'test') {
        console.log(chalk.yellow('🔄 Force mode: Updating framework files...'));
      } else {
        spinner.text = 'Force mode: Updating framework files...';
      }
      // Don't remove the entire framework, just mark for force update
    }
    
    // Copy framework files from template
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.blue('📁 Copying framework files...'));
    } else {
      spinner.text = 'Copying framework files...';
    }
    
    await FileManager.copyFrameworkFiles(currentDir, options);
    
    // Create version file
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.blue('📄 Creating version file...'));
    } else {
      spinner.text = 'Creating version file...';
    }
    
    const cliVersion = VersionManager.getCliVersion();
    await VersionManager.createVersionFile(currentDir, cliVersion, options);
    
    // Verify installation
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.blue('🔍 Verifying installation...'));
    } else {
      spinner.text = 'Verifying installation...';
    }
    
    const integrity = await FileManager.checkFrameworkIntegrity(currentDir);
    
    if (!integrity.isValid) {
      throw new Error(`Installation verification failed: ${integrity.missingFiles.join(', ')} missing`);
    }
    
    spinner.stop();
    
    // Success message (always show for consistency)
    console.log(chalk.green('✅ Framework initialized successfully!'));
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(chalk.gray(''));
      
      // Show installation summary
      console.log(chalk.blue('📦 Installation Summary:'));
      console.log(chalk.gray(`  Version: ${cliVersion}`));
      console.log(chalk.gray(`  Commands: ${integrity.commandsCount} files`));
      console.log(chalk.gray(`  Scripts: ${integrity.scriptsCount} files`));
      console.log(chalk.gray(''));
      
      // Show next steps
      console.log(chalk.blue('🎯 Next Steps:'));
      console.log(chalk.gray('1. Check available commands:'));
      console.log(chalk.cyan('   ls .claude/commands/'));
      console.log(chalk.gray('2. Run your first test:'));
      console.log(chalk.cyan('   /run-yaml-test'));
      console.log(chalk.gray('3. View test reports:'));
      console.log(chalk.cyan('   /view-reports-index'));
      console.log(chalk.gray('4. Check framework status:'));
      console.log(chalk.cyan('   claude-test check'));
    }
    
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('❌ Initialization failed:'), error.message);
    
    if (options.verbose) {
      console.error(chalk.red('Error details:'));
      console.error(error.stack);
    } else {
      console.log(chalk.gray('Use --verbose for detailed error information.'));
    }
    
    throw error;
  }
}

module.exports = init;