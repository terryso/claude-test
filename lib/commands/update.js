// const path = require('path'); // Not used currently
const chalk = require('chalk');
const ora = require('ora');
const FileManager = require('../utils/file-manager');
const VersionManager = require('../utils/version-manager');

/**
 * Update framework to latest version
 * @param {Object} options - Command options
 * @param {boolean} options.backup - Create backup before update
 * @param {boolean} options.dryRun - Show what would be updated without making changes
 * @param {boolean} options.verbose - Show detailed output
 */
async function update(options = {}) {
  const spinner = ora('Checking framework status...').start();
  
  try {
    const currentDir = process.cwd();
    
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      spinner.stop();
      console.log(chalk.blue('🔄 Updating claude-test framework...'));
      console.log(chalk.gray(`  Target directory: ${currentDir}`));
    }
    
    // Check if framework exists
    const frameworkExists = await FileManager.isFrameworkExists(currentDir);
    
    if (!frameworkExists) {
      spinner.stop();
      console.log(chalk.red('❌ Framework not found in current directory.'));
      console.log(chalk.gray('Run "claude-test init" to initialize the framework first.'));
      return;
    }
    
    // Get version information
    const currentVersion = await VersionManager.getCurrentVersion(currentDir);
    const cliVersion = VersionManager.getCliVersion();
    
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.blue('📋 Version Information:'));
      console.log(chalk.gray(`  Current framework version: ${currentVersion || 'unknown'}`));
      console.log(chalk.gray(`  CLI version: ${cliVersion}`));
    } else {
      spinner.text = 'Checking versions...';
    }
    
    // Check if update is needed
    if (currentVersion === cliVersion) {
      spinner.stop();
      console.log(chalk.green('✅ Framework is already up to date!'));
      console.log(chalk.gray(`Version: ${cliVersion}`));
      return;
    }
    
    const compatibility = VersionManager.checkCompatibility(currentVersion, cliVersion);
    
    if (options.dryRun) {
      spinner.stop();
      console.log(chalk.blue('🔍 Dry Run - Changes that would be made:'));
      console.log(chalk.gray(`  Framework version: ${currentVersion || 'unknown'} → ${cliVersion}`));
      
      if (options.backup) {
        console.log(chalk.gray('  - Create backup of current framework'));
      }
      
      console.log(chalk.gray('  - Update framework files'));
      console.log(chalk.gray('  - Update version file'));
      console.log(chalk.gray('  - Verify installation integrity'));
      
      if (!compatibility.compatible) {
        console.log(chalk.yellow(`  ⚠️  ${compatibility.reason}`));
      }
      
      console.log(chalk.blue('\nRun without --dry-run to apply these changes.'));
      return;
    }
    
    // Create backup if requested
    if (options.backup) {
      if (options.verbose && process.env.NODE_ENV !== 'test') {
        console.log(chalk.blue('💾 Creating backup...'));
      } else {
        spinner.text = 'Creating backup...';
      }
      
      await FileManager.createBackup(currentDir);
    }
    
    // Update framework files
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.blue('📁 Updating framework files...'));
    } else {
      spinner.text = 'Updating framework files...';
    }
    
    await FileManager.updateFrameworkFiles(currentDir, options);
    
    // Update version file
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.blue('📄 Updating version file...'));
    } else {
      spinner.text = 'Updating version file...';
    }
    
    await VersionManager.updateVersionFile(currentDir, cliVersion, currentVersion, options);
    
    // Verify update
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.blue('🔍 Verifying update...'));
    } else {
      spinner.text = 'Verifying update...';
    }
    
    const integrity = await FileManager.checkFrameworkIntegrity(currentDir);
    
    if (!integrity.isValid) {
      throw new Error(`Update verification failed: ${integrity.missingFiles.join(', ')} missing`);
    }
    
    spinner.stop();
    
    if (process.env.NODE_ENV !== 'test') {
      // Success message
      console.log(chalk.green('✅ Framework updated successfully!'));
      console.log(chalk.gray(''));
      
      // Show update summary
      console.log(chalk.blue('📦 Update Summary:'));
      console.log(chalk.gray(`  Previous version: ${currentVersion || 'unknown'}`));
      console.log(chalk.gray(`  New version: ${cliVersion}`));
      console.log(chalk.gray(`  Commands: ${integrity.commandsCount} files`));
      console.log(chalk.gray(`  Scripts: ${integrity.scriptsCount} files`));
      
      if (options.backup) {
        console.log(chalk.gray('  Backup created: ✅'));
      }
      
      // Show compatibility info
      if (!compatibility.compatible) {
        console.log(chalk.gray(''));
        console.log(chalk.yellow('⚠️  Note:'), compatibility.reason);
        if (compatibility.suggestion) {
          console.log(chalk.gray(`  ${compatibility.suggestion}`));
        }
      }
    }
    
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('❌ Update failed:'), error.message);
    
    if (options.verbose) {
      console.error(chalk.red('Error details:'));
      console.error(error.stack);
    } else {
      console.log(chalk.gray('Use --verbose for detailed error information.'));
    }
    
    throw error;
  }
}

module.exports = update;