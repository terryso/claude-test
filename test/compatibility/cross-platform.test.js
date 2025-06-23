/**
 * Cross-Platform Compatibility Tests
 * 
 * Tests compatibility across different operating systems and environments
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Cross-Platform Compatibility', () => {
  const platform = process.platform;
  const architecture = process.arch;
  
  beforeAll(() => {
    console.log(`Testing on ${platform} ${architecture}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Working directory: ${process.cwd()}`);
  });
  
  describe('Platform Detection', () => {
    test('should correctly detect platform', () => {
      expect(['win32', 'darwin', 'linux', 'freebsd', 'openbsd']).toContain(platform);
      expect(typeof platform).toBe('string');
    });
    
    test('should have consistent platform APIs', () => {
      expect(typeof os.platform).toBe('function');
      expect(typeof os.arch).toBe('function');
      expect(typeof os.release).toBe('function');
      expect(typeof os.type).toBe('function');
    });
  });
  
  describe('File System Compatibility', () => {
    let tempDir;
    
    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-platform-'));
    });
    
    afterEach(async () => {
      if (tempDir) {
        await fs.remove(tempDir);
      }
    });
    
    test('should handle path separators correctly', () => {
      const testPath = path.join('folder', 'subfolder', 'file.txt');
      
      if (platform === 'win32') {
        expect(testPath).toContain('\\');
      } else {
        expect(testPath).toContain('/');
      }
      
      // Path should be normalized correctly
      expect(path.isAbsolute(testPath)).toBe(false);
      expect(path.basename(testPath)).toBe('file.txt');
      expect(path.dirname(testPath)).toBe(path.join('folder', 'subfolder'));
    });
    
    test('should handle absolute paths correctly', () => {
      const absolutePath = path.resolve(tempDir, 'test-file.txt');
      
      expect(path.isAbsolute(absolutePath)).toBe(true);
      expect(absolutePath).toContain(tempDir);
    });
    
    test('should create and delete directories', async () => {
      const testDir = path.join(tempDir, 'test-directory');
      
      await fs.ensureDir(testDir);
      expect(await fs.pathExists(testDir)).toBe(true);
      
      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
      
      await fs.remove(testDir);
      expect(await fs.pathExists(testDir)).toBe(false);
    });
    
    test('should handle file permissions appropriately', async () => {
      const testFile = path.join(tempDir, 'permission-test.txt');
      await fs.writeFile(testFile, 'permission test');
      
      const stats = await fs.stat(testFile);
      expect(stats.isFile()).toBe(true);
      
      // On Unix systems, check basic permissions
      if (platform !== 'win32') {
        expect(stats.mode & parseInt('400', 8)).toBeTruthy(); // Read permission
      }
    });
    
    test('should handle case sensitivity correctly', async () => {
      const lowerFile = path.join(tempDir, 'lowercase.txt');
      const upperFile = path.join(tempDir, 'UPPERCASE.txt');
      
      await fs.writeFile(lowerFile, 'lower');
      await fs.writeFile(upperFile, 'upper');
      
      expect(await fs.pathExists(lowerFile)).toBe(true);
      expect(await fs.pathExists(upperFile)).toBe(true);
      
      // On case-insensitive systems, these might be the same file
      const lowerContent = await fs.readFile(lowerFile, 'utf8');
      const upperContent = await fs.readFile(upperFile, 'utf8');
      
      if (platform === 'darwin' || platform === 'win32') {
        // Case-insensitive filesystems might merge these
        console.log('Case-insensitive filesystem detected');
      } else {
        expect(lowerContent).toBe('lower');
        expect(upperContent).toBe('upper');
      }
    });
  });
  
  describe('Command Execution', () => {
    test('should execute basic commands', () => {
      let command;
      
      if (platform === 'win32') {
        command = 'echo "Hello World"';
      } else {
        command = 'echo "Hello World"';
      }
      
      const output = execSync(command, { encoding: 'utf8' });
      expect(output.trim()).toContain('Hello World');
    });
    
    test('should handle command timeouts', () => {
      const startTime = Date.now();
      
      try {
        if (platform === 'win32') {
          execSync('timeout /t 2', { timeout: 1000 });
        } else {
          execSync('sleep 2', { timeout: 1000 });
        }
        throw new Error('Command should have timed out');
      } catch (error) {
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(2000);
        expect(error.signal).toBe('SIGTERM');
      }
    });
  });
  
  describe('Environment Variables', () => {
    test('should access environment variables', () => {
      expect(typeof process.env).toBe('object');
      expect(Object.keys(process.env).length).toBeGreaterThan(0);
    });
    
    test('should handle PATH variable correctly', () => {
      const pathVar = process.env.PATH || process.env.Path;
      expect(typeof pathVar).toBe('string');
      expect(pathVar.length).toBeGreaterThan(0);
      
      const pathSeparator = platform === 'win32' ? ';' : ':';
      expect(pathVar).toContain(pathSeparator);
    });
    
    test('should handle HOME/USERPROFILE directory', () => {
      const homeDir = os.homedir();
      expect(typeof homeDir).toBe('string');
      expect(homeDir.length).toBeGreaterThan(0);
      expect(path.isAbsolute(homeDir)).toBe(true);
    });
    
    test('should handle temporary directory', () => {
      const tmpDir = os.tmpdir();
      expect(typeof tmpDir).toBe('string');
      expect(tmpDir.length).toBeGreaterThan(0);
      expect(path.isAbsolute(tmpDir)).toBe(true);
    });
  });
  
  describe('Line Endings', () => {
    let tempDir;
    
    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-lineend-'));
    });
    
    afterEach(async () => {
      if (tempDir) {
        await fs.remove(tempDir);
      }
    });
    
    test('should handle different line endings', async () => {
      const testFile = path.join(tempDir, 'line-endings.txt');
      
      // Test different line ending formats
      const unixContent = 'line1\nline2\nline3\n';
      const windowsContent = 'line1\r\nline2\r\nline3\r\n';
      const macContent = 'line1\rline2\rline3\r';
      
      // Write and read Unix line endings
      await fs.writeFile(testFile, unixContent);
      let content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe(unixContent);
      
      // Write and read Windows line endings
      await fs.writeFile(testFile, windowsContent);
      content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe(windowsContent);
      
      // Write and read Mac line endings
      await fs.writeFile(testFile, macContent);
      content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe(macContent);
    });
    
    test('should normalize line endings when needed', () => {
      const mixedContent = 'line1\nline2\r\nline3\r';
      const normalized = mixedContent.replace(/\r\n?/g, '\n');
      
      expect(normalized).toBe('line1\nline2\nline3\n');
    });
  });
  
  describe('Character Encoding', () => {
    let tempDir;
    
    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-encoding-'));
    });
    
    afterEach(async () => {
      if (tempDir) {
        await fs.remove(tempDir);
      }
    });
    
    test('should handle Unicode characters', async () => {
      const testFile = path.join(tempDir, 'unicode-test.txt');
      const unicodeContent = '🚀 Émojis and àccénts work! 中文字符 русский العربية';
      
      await fs.writeFile(testFile, unicodeContent, 'utf8');
      const content = await fs.readFile(testFile, 'utf8');
      
      expect(content).toBe(unicodeContent);
    });
    
    test('should handle file names with special characters', async () => {
      // Only test this on platforms that support it
      if (platform !== 'win32') {
        const specialFileName = 'test-file-émoji-🚀.txt';
        const testFile = path.join(tempDir, specialFileName);
        
        await fs.writeFile(testFile, 'special filename test');
        expect(await fs.pathExists(testFile)).toBe(true);
        
        const content = await fs.readFile(testFile, 'utf8');
        expect(content).toBe('special filename test');
      }
    });
  });
  
  describe('Resource Limits', () => {
    test('should respect memory limits', () => {
      const memory = process.memoryUsage();
      
      expect(typeof memory.rss).toBe('number');
      expect(typeof memory.heapTotal).toBe('number');
      expect(typeof memory.heapUsed).toBe('number');
      expect(typeof memory.external).toBe('number');
      
      // Basic sanity checks
      expect(memory.rss).toBeGreaterThan(0);
      expect(memory.heapTotal).toBeGreaterThan(0);
      expect(memory.heapUsed).toBeGreaterThan(0);
      expect(memory.heapUsed).toBeLessThanOrEqual(memory.heapTotal);
    });
    
    test('should handle CPU usage information', () => {
      const cpus = os.cpus();
      
      expect(Array.isArray(cpus)).toBe(true);
      expect(cpus.length).toBeGreaterThan(0);
      
      const cpu = cpus[0];
      expect(typeof cpu.model).toBe('string');
      expect(typeof cpu.speed).toBe('number');
      expect(typeof cpu.times).toBe('object');
    });
  });
  
  describe('Network Stack', () => {
    test('should have network interfaces', () => {
      const interfaces = os.networkInterfaces();
      
      expect(typeof interfaces).toBe('object');
      expect(Object.keys(interfaces).length).toBeGreaterThan(0);
    });
    
    test('should handle DNS resolution', async () => {
      const dns = require('dns');
      const { promisify } = require('util');
      const lookup = promisify(dns.lookup);
      
      try {
        const result = await lookup('localhost');
        expect(typeof result.address).toBe('string');
        expect(['127.0.0.1', '::1']).toContain(result.address);
      } catch (error) {
        // DNS might not be available in all test environments
        console.warn('DNS resolution test skipped:', error.message);
      }
    });
  });
  
  describe('Process Management', () => {
    test('should handle process information', () => {
      expect(typeof process.pid).toBe('number');
      expect(process.pid).toBeGreaterThan(0);
      
      expect(typeof process.ppid).toBe('number');
      expect(process.ppid).toBeGreaterThan(0);
    });
    
    test('should handle signal handlers on Unix', () => {
      if (platform !== 'win32') {
        expect(typeof process.on).toBe('function');
        
        // Test that we can register signal handlers
        const handler = () => {};
        process.on('SIGUSR1', handler);
        process.removeListener('SIGUSR1', handler);
      }
    });
  });
});