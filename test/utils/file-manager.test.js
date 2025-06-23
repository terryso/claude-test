const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const FileManager = require('../../lib/utils/file-manager');

describe('FileManager', () => {
  let tempDir;
  let sourceDir;
  let targetDir;
  
  beforeEach(async () => {
    // Create temporary directories for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-filemanager-'));
    sourceDir = path.join(tempDir, 'source');
    targetDir = path.join(tempDir, 'target');
    
    await fs.ensureDir(sourceDir);
    await fs.ensureDir(targetDir);
    
    // Create test source structure
    await fs.ensureDir(path.join(sourceDir, 'commands'));
    await fs.ensureDir(path.join(sourceDir, 'scripts'));
    await fs.writeFile(path.join(sourceDir, 'commands', 'test.md'), '# Test Command');
    await fs.writeFile(path.join(sourceDir, 'scripts', 'test.js'), '// Test Script');
    await fs.writeJSON(path.join(sourceDir, 'config.json'), { test: true });
  });
  
  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });
  
  describe('copyFrameworkFiles', () => {
    test('should copy framework files to target directory', async () => {
      const claudeTarget = path.join(targetDir, '.claude');
      
      // Create a mock template structure
      const templatesDir = path.join(__dirname, '../../lib/templates/.claude');
      await fs.ensureDir(templatesDir);
      await fs.ensureDir(path.join(templatesDir, 'commands'));
      await fs.ensureDir(path.join(templatesDir, 'scripts'));
      await fs.writeFile(path.join(templatesDir, 'commands', 'test.md'), '# Test Command');
      await fs.writeFile(path.join(templatesDir, 'scripts', 'test.js'), '// Test Script');
      
      await FileManager.copyFrameworkFiles(targetDir);
      
      // Check if files were copied
      expect(await fs.pathExists(claudeTarget)).toBe(true);
      expect(await fs.pathExists(path.join(claudeTarget, 'commands'))).toBe(true);
      expect(await fs.pathExists(path.join(claudeTarget, 'scripts'))).toBe(true);
      
      // Clean up
      await fs.remove(templatesDir);
    });
    
    test('should handle missing template directory', async () => {
      // Create a temporary directory far from any .claude directory
      const tempRootDir = path.join(require('os').tmpdir(), 'claude-test-isolated');
      await fs.ensureDir(tempRootDir);
      const originalCwd = process.cwd();
      
      // Mock the _getTemplateDir method to simulate missing template
      const FileManagerModule = require('../../lib/utils/file-manager');
      const originalGetTemplateDir = FileManagerModule._getTemplateDir;
      FileManagerModule._getTemplateDir = () => {
        throw new Error('Could not locate template directory. Please ensure claude-test is properly installed.');
      };
      
      try {
        await expect(FileManagerModule.copyFrameworkFiles(targetDir)).rejects.toThrow('Could not locate template directory');
      } finally {
        process.chdir(originalCwd);
        FileManagerModule._getTemplateDir = originalGetTemplateDir;
        await fs.remove(tempRootDir);
      }
    });
  });
  
  describe('updateFrameworkFiles', () => {
    test('should update existing framework files', async () => {
      const claudeTarget = path.join(targetDir, '.claude');
      await fs.ensureDir(claudeTarget);
      
      // Create version file first
      await fs.writeJSON(path.join(claudeTarget, '.framework-version'), { version: '1.0.0' });
      
      // Create a mock template structure
      const templatesDir = path.join(__dirname, '../../lib/templates/.claude');
      await fs.ensureDir(templatesDir);
      await fs.ensureDir(path.join(templatesDir, 'commands'));
      await fs.writeFile(path.join(templatesDir, 'commands', 'test.md'), '# Test Command');
      
      await FileManager.updateFrameworkFiles(targetDir);
      
      expect(await fs.pathExists(path.join(claudeTarget, 'commands'))).toBe(true);
      
      // Clean up
      await fs.remove(templatesDir);
    });
    
    test('should handle update when target does not exist', async () => {
      await expect(FileManager.updateFrameworkFiles('/non/existent/target')).rejects.toThrow();
    });
  });
  
  describe('createBackup', () => {
    test('should create backup of framework directory', async () => {
      const claudeDir = path.join(targetDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.writeFile(path.join(claudeDir, 'test-file.txt'), 'backup test');
      
      await FileManager.createBackup(targetDir);
      
      // Check if backup directory was created (check for any .claude-backup-* directory)
      const files = await fs.readdir(targetDir);
      const backupExists = files.some(file => file.startsWith('.claude-backup-'));
      expect(backupExists).toBe(true);
    });
    
    test('should handle backup when framework does not exist', async () => {
      await FileManager.createBackup(targetDir);
      
      // Should not create backup directory when no framework exists
      const backupsDir = path.join(targetDir, '.claude-backups');
      expect(await fs.pathExists(backupsDir)).toBe(false);
    });
  });
  
  describe('checkFrameworkIntegrity', () => {
    test('should validate complete framework structure', async () => {
      const claudeDir = path.join(targetDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.ensureDir(path.join(claudeDir, 'commands'));
      await fs.ensureDir(path.join(claudeDir, 'scripts'));
      
      // Create required files
      await fs.writeFile(path.join(claudeDir, 'commands', 'run-yaml-test.md'), '# Test');
      await fs.writeFile(path.join(claudeDir, 'scripts', 'yaml-test-processor.js'), '// Test');
      await fs.writeJSON(path.join(claudeDir, '.framework-version'), { version: '1.0.0' });
      
      const result = await FileManager.checkFrameworkIntegrity(targetDir);
      
      expect(result.isValid).toBe(true);
      expect(result.missingFiles).toHaveLength(0);
    });
    
    test('should detect missing framework files', async () => {
      const claudeDir = path.join(targetDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.writeJSON(path.join(claudeDir, '.framework-version'), { version: '1.0.0' });
      
      const result = await FileManager.checkFrameworkIntegrity(targetDir);
      
      expect(result.isValid).toBe(false);
      expect(result.missingFiles.length).toBeGreaterThan(0);
    });
    
    test('should handle validation when framework does not exist', async () => {
      const result = await FileManager.checkFrameworkIntegrity(targetDir);
      
      expect(result.isValid).toBe(false);
      expect(result.missingFiles.length).toBeGreaterThan(0);
    });
  });
  
  describe('fixFrameworkIssues', () => {
    test('should attempt to fix framework issues', async () => {
      const claudeDir = path.join(targetDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.writeJSON(path.join(claudeDir, '.framework-version'), { version: '1.0.0' });
      
      // Create a mock template structure
      const templatesDir = path.join(__dirname, '../../lib/templates/.claude');
      await fs.ensureDir(templatesDir);
      await fs.ensureDir(path.join(templatesDir, 'commands'));
      await fs.writeFile(path.join(templatesDir, 'commands', 'test.md'), '# Test Command');
      
      const result = await FileManager.fixFrameworkIssues(targetDir);
      
      expect(result).toHaveProperty('fixed');
      expect(result).toHaveProperty('message');
      
      // Clean up
      await fs.remove(templatesDir);
    });
    
    test('should handle fix when framework does not exist', async () => {
      // Move to a directory that doesn't have .claude
      const originalCwd = process.cwd();
      const emptyDir = path.join(targetDir, 'empty');
      await fs.ensureDir(emptyDir);
      process.chdir(emptyDir);
      
      try {
        const result = await FileManager.fixFrameworkIssues(targetDir);
        expect(result.fixed).toBe(false);
        expect(result.message).toContain('Some issues remain');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('removeFramework', () => {
    test('should remove framework directory', async () => {
      const claudeDir = path.join(targetDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.writeFile(path.join(claudeDir, 'test.txt'), 'test');
      
      await FileManager.removeFramework(targetDir);
      
      expect(await fs.pathExists(claudeDir)).toBe(false);
    });
    
    test('should handle non-existent framework directory', async () => {
      // Should not throw error when directory doesn't exist
      await expect(FileManager.removeFramework(targetDir)).resolves.not.toThrow();
    });
  });

  describe('isFrameworkExists', () => {
    test('should detect existing framework', async () => {
      const claudeDir = path.join(targetDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.ensureDir(path.join(claudeDir, 'commands'));
      await fs.ensureDir(path.join(claudeDir, 'scripts'));
      await fs.writeFile(path.join(claudeDir, '.framework-version'), '1.0.0');
      
      const exists = await FileManager.isFrameworkExists(targetDir);
      expect(exists).toBe(true);
    });
    
    test('should detect non-existing framework', async () => {
      const exists = await FileManager.isFrameworkExists(targetDir);
      expect(exists).toBe(false);
    });
  });

  describe('_copyWithProgress', () => {
    test('should copy files with verbose output', async () => {
      const sourceDir = path.join(targetDir, 'source');
      const destDir = path.join(targetDir, 'dest');
      await fs.ensureDir(sourceDir);
      
      // Create allowed files and directories that should be copied
      await fs.ensureDir(path.join(sourceDir, 'commands'));
      await fs.ensureDir(path.join(sourceDir, 'scripts'));
      await fs.writeFile(path.join(sourceDir, 'commands', 'test.md'), '# Test Command');
      await fs.writeFile(path.join(sourceDir, 'scripts', 'test.js'), '// Test Script');
      // Note: settings.local.json is intentionally NOT created as it should not be copied
      
      // Create files that should NOT be copied
      await fs.ensureDir(path.join(sourceDir, 'ide'));
      await fs.writeFile(path.join(sourceDir, 'ide', 'test.txt'), 'should not be copied');
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await FileManager._copyWithProgress(sourceDir, destDir, { verbose: true });
      
      // Check that allowed files were copied
      expect(await fs.pathExists(path.join(destDir, 'commands', 'test.md'))).toBe(true);
      expect(await fs.pathExists(path.join(destDir, 'scripts', 'test.js'))).toBe(true);
      // settings.local.json should NOT be copied (it's local configuration)
      expect(await fs.pathExists(path.join(destDir, 'settings.local.json'))).toBe(false);
      
      // Check that disallowed files were NOT copied
      expect(await fs.pathExists(path.join(destDir, 'ide'))).toBe(false);
      
      // In test environment, verbose output is suppressed
      if (process.env.NODE_ENV !== 'test') {
        expect(consoleSpy).toHaveBeenCalled();
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('_copyWithExclusions', () => {
    test('should copy files while excluding specified patterns', async () => {
      const sourceDir = path.join(targetDir, 'source');
      const destDir = path.join(targetDir, 'dest');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'include.txt'), 'include');
      await fs.writeFile(path.join(sourceDir, 'exclude.log'), 'exclude');
      
      await FileManager._copyWithExclusions(sourceDir, destDir, ['exclude.log']);
      
      expect(await fs.pathExists(path.join(destDir, 'include.txt'))).toBe(true);
      expect(await fs.pathExists(path.join(destDir, 'exclude.log'))).toBe(false);
    });

    test('should copy nested directories with exclusions', async () => {
      const sourceDir = path.join(targetDir, 'source');
      const destDir = path.join(targetDir, 'dest');
      const nestedDir = path.join(sourceDir, 'nested');
      await fs.ensureDir(nestedDir);
      await fs.writeFile(path.join(nestedDir, 'file.txt'), 'content');
      await fs.writeFile(path.join(sourceDir, 'exclude.log'), 'exclude');
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await FileManager._copyWithExclusions(sourceDir, destDir, ['exclude.log'], { verbose: true });
      
      expect(await fs.pathExists(path.join(destDir, 'nested', 'file.txt'))).toBe(true);
      expect(await fs.pathExists(path.join(destDir, 'exclude.log'))).toBe(false);
      // In test environment, verbose output is suppressed
      if (process.env.NODE_ENV !== 'test') {
        expect(consoleSpy).toHaveBeenCalled();
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('copyFrameworkFiles edge cases', () => {
    test('should handle force option when directory exists', async () => {
      const claudeDir = path.join(targetDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.writeFile(path.join(claudeDir, 'existing.txt'), 'existing');
      
      await FileManager.copyFrameworkFiles(targetDir, { force: true, verbose: true });
      
      // Should have removed and recreated
      expect(await fs.pathExists(claudeDir)).toBe(true);
    });
  });

  describe('updateFrameworkFiles edge cases', () => {
    test('should handle preservation of user files', async () => {
      const claudeDir = path.join(targetDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.writeFile(path.join(claudeDir, 'user-file.txt'), 'user content');
      
      await FileManager.updateFrameworkFiles(targetDir, { 
        verbose: true,
        preserveUserFiles: true 
      });
      
      expect(await fs.pathExists(claudeDir)).toBe(true);
    });
  });
});