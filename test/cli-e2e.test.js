/**
 * End-to-End CLI Tests
 * 
 * These tests verify the CLI tool works correctly when installed globally.
 * They run against the actual CLI binary to ensure real-world functionality.
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Skip E2E tests in CI unless explicitly enabled
const runE2ETests = process.env.RUN_E2E_TESTS === 'true' || process.env.NODE_ENV === 'test';

describe('CLI End-to-End Tests', () => {
  let tempDir;
  let packagePath;
  
  beforeAll(async () => {
    if (!runE2ETests) {
      console.log('Skipping E2E tests. Set RUN_E2E_TESTS=true to enable.');
      return;
    }
    
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-e2e-'));
    
    // Pack the current package
    try {
      const output = execSync('npm pack', { 
        cwd: process.cwd(),
        encoding: 'utf8'
      });
      
      const packageFile = output.trim().split('\n').pop();
      packagePath = path.join(process.cwd(), packageFile);
      
      console.log('Created package:', packagePath);
    } catch (error) {
      console.error('Failed to create package:', error.message);
      throw error;
    }
  }, 60000); // 60 second timeout
  
  afterAll(async () => {
    if (!runE2ETests) return;
    
    // Clean up
    if (tempDir) {
      await fs.remove(tempDir);
    }
    
    if (packagePath && await fs.pathExists(packagePath)) {
      await fs.remove(packagePath);
    }
  });
  
  beforeEach(() => {
    if (!runE2ETests) {
      return test.skip();
    }
  });
  
  describe('package installation', () => {
    test('should install package globally', async () => {
      if (!runE2ETests) return;
      
      try {
        // Install the package globally
        execSync(`npm install -g ${packagePath}`, {
          stdio: 'pipe',
          timeout: 30000
        });
        
        // Verify installation
        const output = execSync('claude-test --version', {
          encoding: 'utf8',
          timeout: 10000
        });
        
        expect(output).toMatch(/\d+\.\d+\.\d+/);
      } catch (error) {
        console.error('Installation failed:', error.message);
        throw error;
      }
    }, 45000);
    
    test('should show help information', () => {
      if (!runE2ETests) return;
      
      const output = execSync('claude-test --help', {
        encoding: 'utf8',
        timeout: 10000
      });
      
      expect(output).toContain('Usage:');
      expect(output).toContain('init');
      expect(output).toContain('update');
      expect(output).toContain('check');
    });
  });
  
  describe('framework initialization', () => {
    test('should initialize framework in empty directory', () => {
      if (!runE2ETests) return;
      
      const testDir = path.join(tempDir, 'init-test');
      fs.ensureDirSync(testDir);
      
      const output = execSync('claude-test init --verbose', {
        cwd: testDir,
        encoding: 'utf8',
        timeout: 30000
      });
      
      expect(output).toContain('initialized successfully') || 
      expect(output).toContain('Framework setup complete');
      
      // Verify framework structure
      expect(fs.pathExistsSync(path.join(testDir, '.claude'))).toBe(true);
      expect(fs.pathExistsSync(path.join(testDir, '.claude', 'commands'))).toBe(true);
      expect(fs.pathExistsSync(path.join(testDir, '.claude', 'scripts'))).toBe(true);
      expect(fs.pathExistsSync(path.join(testDir, '.claude', '.framework-version'))).toBe(true);
    });
    
    test('should check framework status', () => {
      if (!runE2ETests) return;
      
      const testDir = path.join(tempDir, 'check-test');
      fs.ensureDirSync(testDir);
      
      // Initialize first
      execSync('claude-test init', {
        cwd: testDir,
        stdio: 'pipe',
        timeout: 30000
      });
      
      // Then check
      const output = execSync('claude-test check', {
        cwd: testDir,
        encoding: 'utf8',
        timeout: 10000
      });
      
      expect(output).toContain('Framework') || 
      expect(output).toContain('Version');
    });
  });
  
  describe('error handling', () => {
    test('should handle invalid commands gracefully', () => {
      if (!runE2ETests) return;
      
      try {
        execSync('claude-test invalid-command', {
          encoding: 'utf8',
          timeout: 10000
        });
        
        // If we get here, the command didn't fail as expected
        throw new Error('Command should have failed');
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout || error.stderr).toContain('Invalid command') ||
        expect(error.stdout || error.stderr).toContain('help');
      }
    });
    
    test('should show error for missing framework', () => {
      if (!runE2ETests) return;
      
      const emptyDir = path.join(tempDir, 'empty-test');
      fs.ensureDirSync(emptyDir);
      
      const output = execSync('claude-test check', {
        cwd: emptyDir,
        encoding: 'utf8',
        timeout: 10000
      });
      
      expect(output).toContain('Framework not found') ||
      expect(output).toContain('not initialized');
    });
  });
  
  describe('update functionality', () => {
    test('should handle update in dry-run mode', () => {
      if (!runE2ETests) return;
      
      const testDir = path.join(tempDir, 'update-test');
      fs.ensureDirSync(testDir);
      
      // Initialize first
      execSync('claude-test init', {
        cwd: testDir,
        stdio: 'pipe',
        timeout: 30000
      });
      
      // Try update in dry-run mode
      const output = execSync('claude-test update --dry-run', {
        cwd: testDir,
        encoding: 'utf8',
        timeout: 15000
      });
      
      expect(output).toContain('up to date') ||
      expect(output).toContain('dry run') ||
      expect(output).toContain('would');
    });
  });
  
  afterAll(async () => {
    if (!runE2ETests) return;
    
    try {
      // Uninstall the global package
      execSync('npm uninstall -g claude-test', {
        stdio: 'pipe',
        timeout: 30000
      });
    } catch (error) {
      console.warn('Failed to uninstall package:', error.message);
    }
  });
});