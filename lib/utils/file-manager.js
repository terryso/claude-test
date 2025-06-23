const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class FileManager {
  /**
   * Check if framework exists in the given directory
   * @param {string} targetDir - Target directory path
   * @returns {boolean} - True if framework exists
   */
  static async isFrameworkExists(targetDir) {
    const claudeDir = path.join(targetDir, '.claude');
    const versionFile = path.join(claudeDir, '.framework-version');
    
    return await fs.pathExists(claudeDir) && await fs.pathExists(versionFile);
  }
  
  /**
   * Copy framework files from template to target directory
   * @param {string} targetDir - Target directory path
   * @param {Object} options - Copy options
   */
  static async copyFrameworkFiles(targetDir, options = {}) {
    // Find the project root directory (where .claude exists)
    const projectRoot = this._findProjectRoot();
    const templateDir = path.join(projectRoot, '.claude');
    const claudeDir = path.join(targetDir, '.claude');
    
    // Ensure template directory exists
    if (!await fs.pathExists(templateDir)) {
      throw new Error('Claude framework directory not found. Please ensure you are running from a valid claude-test project.');
    }
    
    // Remove existing .claude directory if it exists and force is enabled
    if (await fs.pathExists(claudeDir) && options.force) {
      if (options.verbose) {
        console.log(chalk.gray('  Removing existing framework...'));
      }
      await fs.remove(claudeDir);
    }
    
    // Create target directory if it doesn't exist
    await fs.ensureDir(claudeDir);
    
    // Copy template files
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.gray('  Copying framework files...'));
    }
    
    await this._copyWithProgress(templateDir, claudeDir, options);
  }
  
  /**
   * Update framework files while preserving user customizations
   * @param {string} targetDir - Target directory path
   * @param {Object} options - Update options
   */
  static async updateFrameworkFiles(targetDir, options = {}) {
    // Find the project root directory (where .claude exists)
    const projectRoot = this._findProjectRoot();
    const templateDir = path.join(projectRoot, '.claude');
    const claudeDir = path.join(targetDir, '.claude');
    
    // Ensure template directory exists
    if (!await fs.pathExists(templateDir)) {
      throw new Error('Claude framework directory not found. Please ensure you are running from a valid claude-test project.');
    }
    
    // Preserve certain files during update
    const preserveFiles = ['.framework-version', 'settings.local.json'];
    
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.gray('  Updating framework files...'));
    }
    
    await this._copyWithExclusions(templateDir, claudeDir, preserveFiles, options);
  }
  
  /**
   * Remove framework from target directory
   * @param {string} targetDir - Target directory path
   */
  static async removeFramework(targetDir) {
    const claudeDir = path.join(targetDir, '.claude');
    
    if (await fs.pathExists(claudeDir)) {
      await fs.remove(claudeDir);
    }
  }
  
  /**
   * Create backup of current framework
   * @param {string} targetDir - Target directory path
   */
  static async createBackup(targetDir) {
    const claudeDir = path.join(targetDir, '.claude');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(targetDir, `.claude-backup-${timestamp}`);
    
    if (await fs.pathExists(claudeDir)) {
      await fs.copy(claudeDir, backupDir);
      if (process.env.NODE_ENV !== 'test') {
        console.log(chalk.gray(`  Backup created: ${path.basename(backupDir)}`));
      }
    }
  }
  
  /**
   * Check framework file integrity
   * @param {string} targetDir - Target directory path
   * @returns {Object} - Integrity check result
   */
  static async checkFrameworkIntegrity(targetDir) {
    const claudeDir = path.join(targetDir, '.claude');
    const commandsDir = path.join(claudeDir, 'commands');
    const scriptsDir = path.join(claudeDir, 'scripts');
    
    const result = {
      isValid: true,
      missingFiles: [],
      commandsCount: 0,
      scriptsCount: 0,
      extraInfo: {}
    };
    
    // Check essential directories and files
    const essentialPaths = [
      { path: claudeDir, type: 'directory', name: '.claude' },
      { path: commandsDir, type: 'directory', name: 'commands' },
      { path: scriptsDir, type: 'directory', name: 'scripts' },
      { path: path.join(claudeDir, '.framework-version'), type: 'file', name: '.framework-version' }
    ];
    
    for (const item of essentialPaths) {
      if (!await fs.pathExists(item.path)) {
        result.isValid = false;
        result.missingFiles.push(item.name);
      }
    }
    
    // Count files if directories exist
    if (await fs.pathExists(commandsDir)) {
      try {
        const commandFiles = await fs.readdir(commandsDir);
        result.commandsCount = commandFiles.filter(file => file.endsWith('.md')).length;
      } catch (error) {
        result.extraInfo.commandsError = error.message;
      }
    }
    
    if (await fs.pathExists(scriptsDir)) {
      try {
        const scriptFiles = await fs.readdir(scriptsDir);
        result.scriptsCount = scriptFiles.filter(file => 
          file.endsWith('.js') && !file.endsWith('.test.js')
        ).length;
      } catch (error) {
        result.extraInfo.scriptsError = error.message;
      }
    }
    
    return result;
  }
  
  /**
   * Fix framework integrity issues
   * @param {string} targetDir - Target directory path
   * @param {Object} options - Fix options
   */
  static async fixFrameworkIssues(targetDir, options = {}) {
    const integrity = await this.checkFrameworkIntegrity(targetDir);
    
    if (integrity.isValid) {
      return { fixed: false, message: 'No issues found' };
    }
    
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.yellow('  Attempting to fix integrity issues...'));
    }
    
    // Attempt to restore missing files
    await this.updateFrameworkFiles(targetDir, options);
    
    // Re-check integrity
    const newIntegrity = await this.checkFrameworkIntegrity(targetDir);
    
    return {
      fixed: newIntegrity.isValid,
      message: newIntegrity.isValid ? 'Issues fixed successfully' : 'Some issues remain'
    };
  }
  
  /**
   * Copy files with progress indication
   * @private
   */
  static async _copyWithProgress(src, dest, options = {}) {
    await fs.copy(src, dest, {
      overwrite: true,
      filter: (srcPath, _destPath) => {
        if (options.verbose && process.env.NODE_ENV !== 'test') {
          const relativePath = path.relative(src, srcPath);
          if (relativePath) {
            console.log(chalk.gray(`    ${relativePath}`));
          }
        }
        return true;
      }
    });
  }
  
  /**
   * Find the project root directory (contains .claude directory)
   * @private
   */
  static _findProjectRoot() {
    let currentDir = __dirname;
    
    // Walk up the directory tree to find .claude directory
    while (currentDir !== path.dirname(currentDir)) {
      const claudeDir = path.join(currentDir, '.claude');
      if (fs.existsSync(claudeDir)) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    // If not found, try relative to the CLI installation
    const cliRoot = path.join(__dirname, '../..');
    const claudeInCli = path.join(cliRoot, '.claude');
    if (fs.existsSync(claudeInCli)) {
      return cliRoot;
    }
    
    // Fallback to current working directory
    const cwd = process.cwd();
    const claudeInCwd = path.join(cwd, '.claude');
    if (fs.existsSync(claudeInCwd)) {
      return cwd;
    }
    
    throw new Error('Could not locate .claude directory. Please run from a valid claude-test project.');
  }

  /**
   * Copy files with exclusions
   * @private
   */
  static async _copyWithExclusions(src, dest, excludePattern = [], options = {}) {
    const items = await fs.readdir(src);
    
    for (const item of items) {
      if (excludePattern.includes(item)) {
        if (options.verbose && process.env.NODE_ENV !== 'test') {
          console.log(chalk.gray(`    Preserving: ${item}`));
        }
        continue;
      }
      
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = await fs.stat(srcPath);
      
      if (stat.isDirectory()) {
        await fs.ensureDir(destPath);
        await this._copyWithExclusions(srcPath, destPath, excludePattern, options);
      } else {
        await fs.copy(srcPath, destPath);
        if (options.verbose && process.env.NODE_ENV !== 'test') {
          console.log(chalk.gray(`    Updated: ${item}`));
        }
      }
    }
  }
}

module.exports = FileManager;