// const path = require('path'); // Not used currently
const chalk = require('chalk');
const ora = require('ora');
const FileManager = require('../utils/file-manager');
const VersionManager = require('../utils/version-manager');

/**
 * Check framework version and status
 * @param {Object} options - Command options
 * @param {boolean} options.remote - Check for remote updates (placeholder)
 * @param {boolean} options.fix - Attempt to fix integrity issues
 * @param {boolean} options.verbose - Show detailed output
 */
async function check(options = {}) {
  const spinner = ora('Checking framework status...').start();
  
  try {
    const currentDir = process.cwd();
    
    if (options.verbose) {
      spinner.stop();
      console.log(chalk.blue('🔍 Checking claude-test framework status...'));
      console.log(chalk.gray(`  Directory: ${currentDir}`));
      console.log(chalk.gray(''));
    }
    
    // Check if framework exists
    const frameworkExists = await FileManager.isFrameworkExists(currentDir);
    
    if (!frameworkExists) {
      spinner.stop();
      console.log(chalk.red('❌ Framework not found in current directory'));
      console.log(chalk.gray('Run "claude-test init" to initialize the framework.'));
      return;
    }
    
    if (!options.verbose) {
      spinner.text = 'Framework found, checking details...';
    }
    
    spinner.stop();
    console.log(chalk.green('✅ Framework found'));
    
    // Get version information
    const versionInfo = await VersionManager.getVersionInfo(currentDir);
    const currentVersion = versionInfo?.version;
    const cliVersion = VersionManager.getCliVersion();
    const display = VersionManager.formatVersionDisplay(versionInfo);
    
    console.log(chalk.gray(''));
    console.log(chalk.blue('📦 Version Information:'));
    console.log(chalk.gray(`  CLI Tool Version: ${cliVersion}`));
    console.log(chalk.gray(`  Framework Version: ${display.current}`));
    console.log(chalk.gray(`  Installed: ${display.installed}`));
    
    if (display.updated) {
      console.log(chalk.gray(`  Last Updated: ${display.updated}`));
    }
    
    if (display.previous) {
      console.log(chalk.gray(`  Previous Version: ${display.previous}`));
    }
    
    // Version compatibility check
    const compatibility = VersionManager.checkCompatibility(currentVersion, cliVersion);
    
    if (compatibility.compatible) {
      console.log(chalk.green('✅ Framework version is compatible with CLI'));
    } else {
      console.log(chalk.yellow('⚠️  Version compatibility issue detected'));
      console.log(chalk.gray(`  ${compatibility.reason}`));
      if (compatibility.suggestion) {
        console.log(chalk.gray(`  Suggestion: ${compatibility.suggestion}`));
      }
    }
    
    // Check framework integrity
    console.log(chalk.gray(''));
    console.log(chalk.blue('🔍 Framework Integrity:'));
    
    if (!options.verbose) {
      spinner.text = 'Checking file integrity...';
    } else {
      console.log(chalk.gray('  Checking file integrity...'));
    }
    
    const integrity = await FileManager.checkFrameworkIntegrity(currentDir);
    
    if (integrity.isValid) {
      console.log(chalk.green('✅ All framework files are present'));
      console.log(chalk.gray(`  Commands: ${integrity.commandsCount} files`));
      console.log(chalk.gray(`  Scripts: ${integrity.scriptsCount} files`));
      
      if (options.verbose && Object.keys(integrity.extraInfo).length > 0) {
        console.log(chalk.gray('  Additional info:'));
        Object.entries(integrity.extraInfo).forEach(([key, value]) => {
          console.log(chalk.gray(`    ${key}: ${value}`));
        });
      }
    } else {
      console.log(chalk.red('❌ Framework integrity check failed'));
      console.log(chalk.gray('Missing files:'));
      integrity.missingFiles.forEach(file => {
        console.log(chalk.red(`  - ${file}`));
      });
      
      if (options.fix) {
        console.log(chalk.gray(''));
        console.log(chalk.blue('🔧 Attempting to fix issues...'));
        
        const fixResult = await FileManager.fixFrameworkIssues(currentDir, options);
        
        if (fixResult.fixed) {
          console.log(chalk.green('✅ Issues fixed successfully'));
        } else {
          console.log(chalk.yellow('⚠️  Some issues could not be automatically fixed'));
          console.log(chalk.gray('Try running "claude-test update" to restore all files.'));
        }
      } else {
        console.log(chalk.gray(''));
        console.log(chalk.gray('Use --fix to attempt automatic repair, or run "claude-test update".'));
      }
    }
    
    // Show recommendations
    console.log(chalk.gray(''));
    console.log(chalk.blue('💡 Recommendations:'));
    
    if (!compatibility.compatible) {
      console.log(chalk.gray('• Run "claude-test update" to sync framework with CLI version'));
    }
    
    if (!integrity.isValid && !options.fix) {
      console.log(chalk.gray('• Run "claude-test check --fix" to repair missing files'));
    }
    
    if (compatibility.compatible && integrity.isValid) {
      console.log(chalk.gray('• Framework is in good condition'));
      console.log(chalk.gray('• Check "claude-test --help" for available commands'));
    }
    
    // Remote version check
    if (options.remote) {
      console.log(chalk.gray(''));
      console.log(chalk.blue('🌐 Remote Version Check:'));
      
      if (!options.verbose) {
        spinner.start();
        spinner.text = 'Checking NPM registry...';
      } else {
        console.log(chalk.gray('  Checking NPM registry for latest version...'));
      }
      
      const remoteVersion = await VersionManager.checkRemoteVersion();
      
      if (!options.verbose) {
        spinner.stop();
      }
      
      if (remoteVersion) {
        console.log(chalk.gray(`  Latest version on NPM: ${remoteVersion}`));
        console.log(chalk.gray(`  Current CLI version: ${cliVersion}`));
        
        const isUpdateAvailable = VersionManager.isUpdateAvailable(cliVersion, remoteVersion);
        
        if (isUpdateAvailable) {
          console.log(chalk.yellow('📦 Update available!'));
          console.log(chalk.gray('  Run "npm update -g claude-test" to update CLI'));
        } else {
          console.log(chalk.green('✅ CLI is up to date'));
        }
      } else {
        console.log(chalk.yellow('⚠️  Could not fetch remote version'));
        console.log(chalk.gray('  Check your internet connection or try again later'));
      }
    }
    
    spinner.stop();
    
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('❌ Check failed:'), error.message);
    
    if (options.verbose) {
      console.error(chalk.red('Error details:'));
      console.error(error.stack);
    } else {
      console.log(chalk.gray('Use --verbose for detailed error information.'));
    }
    
    throw error;
  }
}

module.exports = check;