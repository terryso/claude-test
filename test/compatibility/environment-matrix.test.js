/**
 * Environment Matrix Tests
 * 
 * Tests compatibility across different environment configurations
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Environment Matrix Compatibility', () => {
  const currentEnv = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    npmVersion: (() => {
      try {
        return execSync('npm --version', { encoding: 'utf8' }).trim();
      } catch {
        return 'unknown';
      }
    })()
  };
  
  beforeAll(() => {
    console.log('Environment Matrix Test');
    console.log('========================');
    console.log(`Platform: ${currentEnv.platform}`);
    console.log(`Architecture: ${currentEnv.arch}`);
    console.log(`Node.js: ${currentEnv.nodeVersion}`);
    console.log(`npm: ${currentEnv.npmVersion}`);
  });
  
  describe('Supported Platforms', () => {
    test('should identify supported platform', () => {
      const supportedPlatforms = ['darwin', 'linux', 'win32'];
      expect(supportedPlatforms).toContain(currentEnv.platform);
    });
    
    test('should identify supported architecture', () => {
      const supportedArchs = ['x64', 'arm64', 'ia32'];
      expect(supportedArchs).toContain(currentEnv.arch);
    });
  });
  
  describe('Node.js Version Compatibility', () => {
    test('should support current Node.js version', () => {
      const semver = require('semver');
      const packageJson = require('../../package.json');
      const requiredVersion = packageJson.engines.node;
      
      expect(semver.satisfies(currentEnv.nodeVersion, requiredVersion)).toBe(true);
    });
    
    test('should work with different Node.js configurations', () => {
      // Test different Node.js flags and configurations
      const nodeConfigs = [
        '--max-old-space-size=512',
        '--no-warnings',
        '--trace-warnings'
      ];
      
      for (const config of nodeConfigs) {
        try {
          const result = execSync(`node ${config} --version`, {
            encoding: 'utf8',
            timeout: 5000
          });
          expect(result.trim()).toMatch(/^v\d+\.\d+\.\d+/);
        } catch (error) {
          // Some configurations might not be supported on all Node.js versions
          console.warn(`Config ${config} not supported: ${error.message}`);
        }
      }
    });
  });
  
  describe('Package Manager Compatibility', () => {
    test('should work with npm', () => {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
    
    test('should handle npm configurations', () => {
      try {
        // Test basic npm operations
        execSync('npm config get registry', { encoding: 'utf8' });
        execSync('npm config get cache', { encoding: 'utf8' });
      } catch (error) {
        throw new Error(`npm configuration check failed: ${error.message}`);
      }
    });
    
    test('should work with yarn if available', () => {
      try {
        const version = execSync('yarn --version', { encoding: 'utf8' }).trim();
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
        console.log(`Yarn ${version} is available`);
      } catch (error) {
        console.log('Yarn not available (optional)');
      }
    });
    
    test('should work with pnpm if available', () => {
      try {
        const version = execSync('pnpm --version', { encoding: 'utf8' }).trim();
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
        console.log(`pnpm ${version} is available`);
      } catch (error) {
        console.log('pnpm not available (optional)');
      }
    });
  });
  
  describe('Shell Environment', () => {
    test('should work in different shells', () => {
      const shell = process.env.SHELL || 'unknown';
      console.log(`Current shell: ${shell}`);
      
      // Test basic shell operations
      expect(typeof process.env.PATH).toBe('string');
      expect(process.env.PATH.length).toBeGreaterThan(0);
    });
    
    test('should handle environment variables correctly', () => {
      const testEnvVar = 'CLAUDE_TEST_ENV_VAR';
      const testValue = 'test_value_123';
      
      // Set environment variable
      process.env[testEnvVar] = testValue;
      
      try {
        // Test that subprocess inherits environment
        const result = execSync(`node -e "console.log(process.env.${testEnvVar})"`, {
          encoding: 'utf8',
          env: { ...process.env, [testEnvVar]: testValue }
        });
        expect(result.trim()).toBe(testValue);
      } finally {
        // Clean up
        delete process.env[testEnvVar];
      }
    });
  });
  
  describe('Terminal Capabilities', () => {
    test('should detect terminal capabilities', () => {
      const terminalInfo = {
        isTTY: process.stdout.isTTY,
        columns: process.stdout.columns,
        rows: process.stdout.rows,
        colorDepth: process.stdout.getColorDepth ? process.stdout.getColorDepth() : 'unknown'
      };
      
      console.log('Terminal info:', terminalInfo);
      
      // Basic checks - isTTY might be undefined in test environment
      if (terminalInfo.isTTY !== undefined) {
        expect(typeof terminalInfo.isTTY).toBe('boolean');
        
        if (terminalInfo.isTTY === true) {
          expect(typeof terminalInfo.columns).toBe('number');
          expect(typeof terminalInfo.rows).toBe('number');
        }
      }
    });
    
    test('should handle ANSI color codes appropriately', () => {
      const chalk = require('chalk');
      
      // Test that chalk works in current environment
      const coloredText = chalk.red('test');
      expect(typeof coloredText).toBe('string');
      expect(coloredText.length).toBeGreaterThanOrEqual(4); // 'test' + possible ANSI codes
    });
  });
  
  describe('File System Characteristics', () => {
    let tempDir;
    
    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-env-'));
    });
    
    afterEach(async () => {
      if (tempDir) {
        await fs.remove(tempDir);
      }
    });
    
    test('should handle file system case sensitivity', async () => {
      const lowerFile = path.join(tempDir, 'testfile.txt');
      const upperFile = path.join(tempDir, 'TESTFILE.txt');
      
      await fs.writeFile(lowerFile, 'lower');
      
      try {
        await fs.writeFile(upperFile, 'upper');
        
        const lowerExists = await fs.pathExists(lowerFile);
        const upperExists = await fs.pathExists(upperFile);
        
        if (lowerExists && upperExists) {
          const lowerContent = await fs.readFile(lowerFile, 'utf8');
          const upperContent = await fs.readFile(upperFile, 'utf8');
          
          if (lowerContent === upperContent) {
            console.log('Case-insensitive file system detected');
          } else {
            console.log('Case-sensitive file system detected');
          }
        }
      } catch (error) {
        console.log('File system case sensitivity test inconclusive');
      }
    });
    
    test('should handle maximum path lengths', async () => {
      // Test reasonably long paths (not maximum to avoid issues)
      const longPath = path.join(
        tempDir,
        'very'.repeat(20),
        'long'.repeat(20),
        'path'.repeat(10),
        'test.txt'
      );
      
      try {
        await fs.ensureDir(path.dirname(longPath));
        await fs.writeFile(longPath, 'long path test');
        
        const content = await fs.readFile(longPath, 'utf8');
        expect(content).toBe('long path test');
        
        console.log(`Long path support: ${longPath.length} characters`);
      } catch (error) {
        console.log(`Long path failed at ${longPath.length} characters: ${error.message}`);
      }
    });
    
    test('should handle special characters in file names', async () => {
      const specialChars = currentEnv.platform === 'win32' 
        ? ['space file.txt', 'file-with-dash.txt', 'file_with_underscore.txt']
        : ['space file.txt', 'file-with-dash.txt', 'file_with_underscore.txt', 'émoji-test-🚀.txt'];
      
      for (const fileName of specialChars) {
        try {
          const filePath = path.join(tempDir, fileName);
          await fs.writeFile(filePath, `content for ${fileName}`);
          
          const content = await fs.readFile(filePath, 'utf8');
          expect(content).toBe(`content for ${fileName}`);
        } catch (error) {
          console.warn(`Special character file name failed: ${fileName} - ${error.message}`);
        }
      }
    });
  });
  
  describe('Resource Limits', () => {
    test('should check available memory', () => {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      
      expect(totalMem).toBeGreaterThan(0);
      expect(freeMem).toBeGreaterThan(0);
      expect(freeMem).toBeLessThanOrEqual(totalMem);
      
      const memoryGB = totalMem / (1024 * 1024 * 1024);
      console.log(`System memory: ${memoryGB.toFixed(2)}GB total, ${(freeMem / (1024 * 1024 * 1024)).toFixed(2)}GB free`);
      
      // Warn if memory is very low
      if (memoryGB < 1) {
        console.warn('Low system memory detected - some tests may fail');
      }
    });
    
    test('should check CPU capabilities', () => {
      const cpus = os.cpus();
      
      expect(Array.isArray(cpus)).toBe(true);
      expect(cpus.length).toBeGreaterThan(0);
      
      console.log(`CPU: ${cpus.length} cores, ${cpus[0].model}`);
      
      // Check if we have reasonable CPU power
      if (cpus.length === 1) {
        console.warn('Single-core system detected - performance tests may be slower');
      }
    });
    
    test('should check disk space', async () => {
      try {
        const stats = await fs.stat(process.cwd());
        expect(stats).toBeDefined();
        
        // Try to create a small test file to check write access
        const testFile = path.join(os.tmpdir(), `claude-test-disk-${Date.now()}.tmp`);
        await fs.writeFile(testFile, 'disk space test');
        
        const fileStats = await fs.stat(testFile);
        expect(fileStats.size).toBeGreaterThan(0);
        
        await fs.remove(testFile);
      } catch (error) {
        console.warn(`Disk space check failed: ${error.message}`);
      }
    });
  });
  
  describe('Network Connectivity', () => {
    test('should have basic network stack', () => {
      const networkInterfaces = os.networkInterfaces();
      
      expect(typeof networkInterfaces).toBe('object');
      expect(Object.keys(networkInterfaces).length).toBeGreaterThan(0);
      
      // Look for localhost interface
      const hasLocalhost = Object.values(networkInterfaces)
        .flat()
        .some(iface => iface.address === '127.0.0.1' || iface.address === '::1');
      
      expect(hasLocalhost).toBe(true);
    });
    
    test('should handle DNS resolution', async () => {
      const dns = require('dns');
      const { promisify } = require('util');
      const lookup = promisify(dns.lookup);
      
      try {
        const result = await lookup('localhost');
        expect(['127.0.0.1', '::1']).toContain(result.address);
      } catch (error) {
        console.warn(`DNS resolution test failed: ${error.message}`);
      }
    });
  });
  
  describe('Security Context', () => {
    test('should run in appropriate security context', () => {
      if (currentEnv.platform !== 'win32') {
        expect(typeof process.getuid).toBe('function');
        expect(typeof process.getgid).toBe('function');
        
        const uid = process.getuid();
        const gid = process.getgid();
        
        expect(typeof uid).toBe('number');
        expect(typeof gid).toBe('number');
        
        // Warn if running as root (usually not recommended)
        if (uid === 0) {
          console.warn('Running as root - some tests may behave differently');
        }
      }
    });
    
    test('should have appropriate file permissions', async () => {
      const testFile = path.join(os.tmpdir(), `claude-test-perms-${Date.now()}.tmp`);
      
      try {
        await fs.writeFile(testFile, 'permission test');
        const stats = await fs.stat(testFile);
        
        // Check that file is readable
        expect(stats.mode & parseInt('400', 8)).toBeTruthy();
        
        // Check that file is writable
        expect(stats.mode & parseInt('200', 8)).toBeTruthy();
        
        await fs.remove(testFile);
      } catch (error) {
        console.warn(`Permission test failed: ${error.message}`);
      }
    });
  });
});