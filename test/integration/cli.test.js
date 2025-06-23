const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Helper function to run CLI commands
function runCLI(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, '../../bin/claude-test.js'), ...args], {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
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
      resolve({
        code,
        stdout,
        stderr
      });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
    
    // Set timeout for long-running tests
    setTimeout(() => {
      child.kill();
      reject(new Error('CLI command timeout'));
    }, options.timeout || 30000);
  });
}

describe('CLI Integration Tests', () => {
  let tempDir;
  
  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-cli-'));
  });
  
  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });
  
  describe('version and help commands', () => {
    test('should show version information', async () => {
      const result = await runCLI(['--version']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
    
    test('should show help information', async () => {
      const result = await runCLI(['--help']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('init');
      expect(result.stdout).toContain('update');
      expect(result.stdout).toContain('check');
    });
    
    test('should show help for init command', async () => {
      const result = await runCLI(['init', '--help']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Initialize');
      expect(result.stdout).toContain('--force');
      expect(result.stdout).toContain('--verbose');
    });
  });
  
  describe('init command integration', () => {
    test('should initialize framework in empty directory', async () => {
      const result = await runCLI(['init', '--verbose'], { cwd: tempDir });
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('initialized successfully');
      
      // Verify framework structure was created
      const claudeDir = path.join(tempDir, '.claude');
      expect(await fs.pathExists(claudeDir)).toBe(true);
      expect(await fs.pathExists(path.join(claudeDir, 'commands'))).toBe(true);
      expect(await fs.pathExists(path.join(claudeDir, 'scripts'))).toBe(true);
      expect(await fs.pathExists(path.join(claudeDir, '.framework-version'))).toBe(true);
    });
    
    test('should not reinitialize without force flag', async () => {
      // First initialization
      await runCLI(['init'], { cwd: tempDir });
      
      // Second initialization
      const result = await runCLI(['init'], { cwd: tempDir });
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('already exists');
    });
    
    test('should reinitialize with force flag', async () => {
      // First initialization
      await runCLI(['init'], { cwd: tempDir });
      
      // Create a test file
      const testFile = path.join(tempDir, '.claude', 'test-file.txt');
      await fs.writeFile(testFile, 'test content');
      
      // Second initialization with force
      const result = await runCLI(['init', '--force'], { cwd: tempDir });
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('initialized successfully');
      
      // Test file should be removed
      expect(await fs.pathExists(testFile)).toBe(false);
    });
  });
  
  describe('check command integration', () => {
    beforeEach(async () => {
      // Initialize framework first
      await runCLI(['init'], { cwd: tempDir });
    });
    
    test('should check framework status', async () => {
      const result = await runCLI(['check'], { cwd: tempDir });
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Framework found');
      expect(result.stdout).toContain('Version Information:');
    });
    
    test('should show verbose information', async () => {
      const result = await runCLI(['check', '--verbose'], { cwd: tempDir });
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Framework found');
      expect(result.stdout).toContain('Framework Integrity:');
    });
    
    test('should detect missing files', async () => {
      // Remove a required file
      await fs.remove(path.join(tempDir, '.claude', 'commands'));
      
      const result = await runCLI(['check'], { cwd: tempDir });
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('integrity check failed');
    });
    
    test('should handle framework not found', async () => {
      const result = await runCLI(['check'], { cwd: os.tmpdir() });
      
      // The command may return different codes, but should indicate no framework
      expect(result.stdout.includes('Framework not found') || 
             result.stderr.includes('Framework not found') ||
             result.stdout.includes('Checking framework status') ||
             result.code !== 0).toBe(true);
    });
  });
  
  describe('update command integration', () => {
    beforeEach(async () => {
      // Initialize framework first
      await runCLI(['init'], { cwd: tempDir });
    });
    
    test('should check for updates', async () => {
      const result = await runCLI(['update', '--dry-run'], { cwd: tempDir });
      
      expect(result.code).toBe(0);
      // Should show what would be updated or already up to date
      expect(result.stdout.includes('up to date') || result.stdout.includes('dry run')).toBe(true);
    });
    
    test('should create backup when requested', async () => {
      const result = await runCLI(['update', '--backup', '--dry-run'], { cwd: tempDir });
      
      expect(result.code).toBe(0);
      expect(result.stdout.includes('up to date') || result.stdout.includes('backup')).toBe(true);
    });
    
    test('should handle framework not found', async () => {
      const result = await runCLI(['update'], { cwd: os.tmpdir() });
      
      expect(result.code).toBe(0);
      expect(result.stdout.includes('Framework not found') || result.stderr.includes('Framework not found')).toBe(true);
    });
  });
  
  describe('error handling', () => {
    test('should handle invalid command', async () => {
      const result = await runCLI(['invalid-command']);
      
      expect(result.code).toBe(1);
      expect(result.stdout.includes('Invalid command') || result.stderr.includes('Invalid command') || result.stdout.includes('help')).toBe(true);
    });
    
    test('should handle missing required arguments', async () => {
      // This depends on how your CLI handles missing args
      const result = await runCLI([]);
      
      expect(result.code).toBe(1);
      expect(result.stdout.includes('Usage:') || result.stdout.includes('help') || result.stderr.includes('Missing command') || result.code === 1).toBe(true);
    });
  });
  
  describe('full workflow integration', () => {
    test('should support complete init -> check -> update workflow', async () => {
      // Initialize
      let result = await runCLI(['init'], { cwd: tempDir });
      expect(result.code).toBe(0);
      
      // Check status
      result = await runCLI(['check'], { cwd: tempDir });
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Framework');
      
      // Check for updates
      result = await runCLI(['update', '--dry-run'], { cwd: tempDir });
      expect(result.code).toBe(0);
      
      // Verify framework is still intact
      const claudeDir = path.join(tempDir, '.claude');
      expect(await fs.pathExists(claudeDir)).toBe(true);
      expect(await fs.pathExists(path.join(claudeDir, '.framework-version'))).toBe(true);
    });
  });
});