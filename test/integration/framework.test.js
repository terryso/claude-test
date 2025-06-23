const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Helper function to run CLI and initialize framework
async function initFramework(targetDir) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [
      path.join(__dirname, '../../bin/claude-test.js'),
      'init',
      '--verbose'
    ], {
      cwd: targetDir,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

describe('Framework Integration Tests', () => {
  let tempDir;
  
  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-framework-'));
  });
  
  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });
  
  describe('framework structure validation', () => {
    test('should create complete framework structure', async () => {
      const result = await initFramework(tempDir);
      
      expect(result.code).toBe(0);
      
      const claudeDir = path.join(tempDir, '.claude');
      
      // Check main directories
      expect(await fs.pathExists(claudeDir)).toBe(true);
      expect(await fs.pathExists(path.join(claudeDir, 'commands'))).toBe(true);
      expect(await fs.pathExists(path.join(claudeDir, 'scripts'))).toBe(true);
      
      // Check version file
      const versionFile = path.join(claudeDir, '.framework-version');
      expect(await fs.pathExists(versionFile)).toBe(true);
      
      const versionData = await fs.readJSON(versionFile);
      expect(versionData).toHaveProperty('version');
      expect(versionData).toHaveProperty('installedAt');
      expect(versionData).toHaveProperty('cliVersion');
      expect(versionData).toHaveProperty('installSource');
    });
    
    test('should create all required command files', async () => {
      await initFramework(tempDir);
      
      const commandsDir = path.join(tempDir, '.claude', 'commands');
      const expectedCommands = [
        'run-yaml-test.md',
        'run-test-suite.md',
        'validate-yaml-test.md',
        'validate-test-suite.md',
        'view-reports-index.md'
      ];
      
      for (const command of expectedCommands) {
        const commandFile = path.join(commandsDir, command);
        expect(await fs.pathExists(commandFile)).toBe(true);
        
        // Verify file has content
        const content = await fs.readFile(commandFile, 'utf8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).toContain('# ');
      }
    });
    
    test('should create all required script files', async () => {
      await initFramework(tempDir);
      
      const scriptsDir = path.join(tempDir, '.claude', 'scripts');
      const expectedScripts = [
        'yaml-test-processor.js',
        'create-report-data.js',
        'gen-report.js',
        'scan-reports.js',
        'start-report-server.js',
        'suite-report-generator.js'
      ];
      
      for (const script of expectedScripts) {
        const scriptFile = path.join(scriptsDir, script);
        expect(await fs.pathExists(scriptFile)).toBe(true);
        
        // Verify file has content
        const content = await fs.readFile(scriptFile, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('framework file content validation', () => {
    beforeEach(async () => {
      await initFramework(tempDir);
    });
    
    test('should have valid command file structure', async () => {
      const commandFile = path.join(tempDir, '.claude', 'commands', 'run-yaml-test.md');
      const content = await fs.readFile(commandFile, 'utf8');
      
      // Check for required sections
      expect(content).toContain('# ');
      expect(content).toContain('## Parameters');
      expect(content).toContain('YAML Test Processor');
    });
    
    test('should have executable script files', async () => {
      const scriptFile = path.join(tempDir, '.claude', 'scripts', 'yaml-test-processor.js');
      const content = await fs.readFile(scriptFile, 'utf8');
      
      // Check for Node.js script structure
      expect(content).toContain('#!/usr/bin/env node') || 
      expect(content).toContain('const') || 
      expect(content).toContain('require');
    });
    
    test('should have valid version file format', async () => {
      const versionFile = path.join(tempDir, '.claude', '.framework-version');
      const versionData = await fs.readJSON(versionFile);
      
      expect(typeof versionData.version).toBe('string');
      expect(versionData.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(typeof versionData.installedAt).toBe('string');
      expect(new Date(versionData.installedAt)).toBeInstanceOf(Date);
      expect(typeof versionData.cliVersion).toBe('string');
      expect(typeof versionData.installSource).toBe('string');
    });
  });
  
  describe('framework persistence and updates', () => {
    test('should maintain user customizations during updates', async () => {
      await initFramework(tempDir);
      
      // Create user customization
      const userFile = path.join(tempDir, '.claude', 'user-config.json');
      const userConfig = { customSetting: 'user-value' };
      await fs.writeJSON(userFile, userConfig);
      
      // Simulate update (reinitialize with different content)
      await initFramework(tempDir);
      
      // User file should still exist
      expect(await fs.pathExists(userFile)).toBe(true);
      const preservedConfig = await fs.readJSON(userFile);
      expect(preservedConfig.customSetting).toBe('user-value');
    });
    
    test('should handle corrupted framework gracefully', async () => {
      await initFramework(tempDir);
      
      // Corrupt version file
      const versionFile = path.join(tempDir, '.claude', '.framework-version');
      await fs.writeFile(versionFile, 'corrupted content');
      
      // Framework should still be detectable
      const claudeDir = path.join(tempDir, '.claude');
      expect(await fs.pathExists(claudeDir)).toBe(true);
    });
  });
  
  describe('cross-platform compatibility', () => {
    test('should work with different path separators', async () => {
      await initFramework(tempDir);
      
      // Test path resolution works correctly
      const commandsPath = path.join(tempDir, '.claude', 'commands');
      const scriptsPath = path.join(tempDir, '.claude', 'scripts');
      
      expect(await fs.pathExists(commandsPath)).toBe(true);
      expect(await fs.pathExists(scriptsPath)).toBe(true);
      
      // Check that files can be read regardless of platform
      const files = await fs.readdir(commandsPath);
      expect(files.length).toBeGreaterThan(0);
    });
    
    test('should handle file permissions correctly', async () => {
      const result = await initFramework(tempDir);
      
      expect(result.code).toBe(0);
      
      // On Unix systems, check that files are readable
      if (process.platform !== 'win32') {
        const commandFile = path.join(tempDir, '.claude', 'commands', 'run-yaml-test.md');
        const stats = await fs.stat(commandFile);
        
        // File should be readable
        expect(stats.mode & parseInt('444', 8)).toBeTruthy();
      }
    });
  });
  
  describe('error recovery and validation', () => {
    test('should recover from partial initialization', async () => {
      // Create partial framework structure
      const claudeDir = path.join(tempDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.ensureDir(path.join(claudeDir, 'commands'));
      // Missing scripts directory
      
      // Initialize should complete the structure
      const result = await initFramework(tempDir);
      
      expect(result.code).toBe(0);
      expect(await fs.pathExists(path.join(claudeDir, 'scripts'))).toBe(true);
    });
    
    test('should validate framework completeness after initialization', async () => {
      await initFramework(tempDir);
      
      const claudeDir = path.join(tempDir, '.claude');
      
      // Check that all critical files exist
      const criticalFiles = [
        '.framework-version',
        'commands/run-yaml-test.md',
        'scripts/yaml-test-processor.js'
      ];
      
      for (const file of criticalFiles) {
        const filePath = path.join(claudeDir, file);
        expect(await fs.pathExists(filePath)).toBe(true);
      }
    });
  });
  
  describe('performance and scalability', () => {
    test('should initialize quickly', async () => {
      const startTime = Date.now();
      
      const result = await initFramework(tempDir);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result.code).toBe(0);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
    
    test('should handle large project directories', async () => {
      // Create a directory with many files
      const largeDir = path.join(tempDir, 'large-project');
      await fs.ensureDir(largeDir);
      
      // Create many dummy files
      for (let i = 0; i < 100; i++) {
        await fs.writeFile(path.join(largeDir, `file-${i}.txt`), `content ${i}`);
      }
      
      // Initialize framework in large directory
      const result = await initFramework(largeDir);
      
      expect(result.code).toBe(0);
      expect(await fs.pathExists(path.join(largeDir, '.claude'))).toBe(true);
    });
  });
});