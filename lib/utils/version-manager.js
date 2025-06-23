const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');
const chalk = require('chalk');

class VersionManager {
  /**
   * Create version file in target directory
   * @param {string} targetDir - Target directory path
   * @param {string} version - Framework version
   * @param {Object} options - Creation options
   */
  static async createVersionFile(targetDir, version, options = {}) {
    const versionFile = path.join(targetDir, '.claude', '.framework-version');
    const versionData = {
      version,
      installedAt: new Date().toISOString(),
      cliVersion: version,
      installSource: 'claude-test-cli'
    };
    
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.gray(`  Creating version file: ${version}`));
    }
    
    await fs.writeJSON(versionFile, versionData, { spaces: 2 });
  }
  
  /**
   * Update version file
   * @param {string} targetDir - Target directory path
   * @param {string} newVersion - New framework version
   * @param {string} oldVersion - Previous framework version
   * @param {Object} options - Update options
   */
  static async updateVersionFile(targetDir, newVersion, oldVersion, options = {}) {
    const versionFile = path.join(targetDir, '.claude', '.framework-version');
    
    const versionData = {
      version: newVersion,
      previousVersion: oldVersion,
      updatedAt: new Date().toISOString(),
      cliVersion: newVersion,
      updateSource: 'claude-test-cli'
    };
    
    // Preserve installation date if it exists
    try {
      const existingData = await fs.readJSON(versionFile);
      if (existingData.installedAt) {
        versionData.installedAt = existingData.installedAt;
      }
      if (existingData.installSource) {
        versionData.installSource = existingData.installSource;
      }
    } catch (error) {
      // File doesn't exist or is invalid, use current timestamp
      versionData.installedAt = new Date().toISOString();
    }
    
    if (options.verbose && process.env.NODE_ENV !== 'test') {
      console.log(chalk.gray(`  Updating version: ${oldVersion} → ${newVersion}`));
    }
    
    await fs.writeJSON(versionFile, versionData, { spaces: 2 });
  }
  
  /**
   * Get current framework version from target directory
   * @param {string} targetDir - Target directory path
   * @returns {string|null} - Current version or null if not found
   */
  static async getCurrentVersion(targetDir) {
    const versionFile = path.join(targetDir, '.claude', '.framework-version');
    
    try {
      const versionData = await fs.readJSON(versionFile);
      return versionData.version;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Get complete version information from target directory
   * @param {string} targetDir - Target directory path
   * @returns {Object|null} - Version information or null if not found
   */
  static async getVersionInfo(targetDir) {
    const versionFile = path.join(targetDir, '.claude', '.framework-version');
    
    try {
      return await fs.readJSON(versionFile);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Check if update is available
   * @param {string} currentVersion - Current version
   * @param {string} latestVersion - Latest version
   * @returns {boolean} - True if update is available
   */
  static isUpdateAvailable(currentVersion, latestVersion) {
    if (!currentVersion || !latestVersion) {
      return false;
    }
    
    try {
      return semver.gt(latestVersion, currentVersion);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Compare two versions
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {number} - -1 if version1 < version2, 0 if equal, 1 if version1 > version2
   */
  static compareVersions(version1, version2) {
    try {
      if (semver.lt(version1, version2)) return -1;
      if (semver.gt(version1, version2)) return 1;
      return 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Get CLI version from package.json
   * @returns {string} - CLI version
   */
  static getCliVersion() {
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      const packageData = require(packagePath);
      return packageData.version;
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Check version compatibility
   * @param {string} frameworkVersion - Framework version
   * @param {string} cliVersion - CLI version
   * @returns {Object} - Compatibility check result
   */
  static checkCompatibility(frameworkVersion, cliVersion) {
    if (!frameworkVersion || !cliVersion) {
      return { compatible: false, reason: 'Missing version information' };
    }
    
    try {
      // For now, we require exact version match
      const compatible = semver.eq(frameworkVersion, cliVersion);
      
      if (!compatible) {
        const comparison = semver.gt(cliVersion, frameworkVersion) ? 'newer' : 'older';
        return {
          compatible: false,
          reason: `CLI version is ${comparison} than framework version`,
          suggestion: 'Run "claude-test update" to sync versions'
        };
      }
      
      return { compatible: true };
    } catch (error) {
      return { compatible: false, reason: 'Invalid version format' };
    }
  }
  
  /**
   * Check for remote version from NPM registry
   * @param {string} packageName - Package name to check
   * @returns {Promise<string|null>} - Latest version or null if failed
   */
  static async checkRemoteVersion(packageName = 'claude-test') {
    try {
      const https = require('https');
      
      return new Promise((resolve) => {
        const options = {
          hostname: 'registry.npmjs.org',
          path: `/${packageName}`,
          method: 'GET',
          timeout: 5000,
          headers: {
            'User-Agent': 'claude-test-cli'
          }
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const packageInfo = JSON.parse(data);
              const latestVersion = packageInfo['dist-tags']?.latest;
              resolve(latestVersion || null);
            } catch (error) {
              resolve(null);
            }
          });
        });
        
        req.on('error', () => {
          resolve(null);
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve(null);
        });
        
        req.setTimeout(5000);
        req.end();
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Format version information for display
   * @param {Object} versionInfo - Version information object
   * @returns {Object} - Formatted version display
   */
  static formatVersionDisplay(versionInfo) {
    if (!versionInfo) {
      return {
        current: 'Unknown',
        installed: 'Unknown',
        source: 'Unknown'
      };
    }
    
    const formatDate = (dateString) => {
      try {
        return new Date(dateString).toLocaleDateString();
      } catch {
        return 'Unknown';
      }
    };
    
    return {
      current: versionInfo.version || 'Unknown',
      installed: formatDate(versionInfo.installedAt),
      updated: versionInfo.updatedAt ? formatDate(versionInfo.updatedAt) : null,
      source: versionInfo.installSource || 'Unknown',
      previous: versionInfo.previousVersion || null
    };
  }
}

module.exports = VersionManager;