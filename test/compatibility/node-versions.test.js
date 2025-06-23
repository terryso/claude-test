/**
 * Node.js Version Compatibility Tests
 * 
 * Tests compatibility across different Node.js versions and features
 */

const semver = require('semver');
const fs = require('fs-extra');
const path = require('path');

describe('Node.js Version Compatibility', () => {
  const nodeVersion = process.version;
  const packageJson = require('../../package.json');
  const requiredVersion = packageJson.engines.node;
  
  beforeAll(() => {
    console.log(`Testing on Node.js ${nodeVersion}`);
    console.log(`Required version: ${requiredVersion}`);
  });
  
  describe('Version Requirements', () => {
    test('should run on supported Node.js version', () => {
      expect(semver.satisfies(nodeVersion, requiredVersion)).toBe(true);
    });
    
    test('should have minimum required features', () => {
      // Test for required Node.js features
      expect(typeof process.version).toBe('string');
      expect(typeof require).toBe('function');
      expect(typeof Buffer).toBe('function');
      expect(typeof process.env).toBe('object');
    });
  });
  
  describe('ES6+ Features Compatibility', () => {
    test('should support async/await', async () => {
      const asyncFunction = async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve('success'), 10);
        });
      };
      
      const result = await asyncFunction();
      expect(result).toBe('success');
    });
    
    test('should support destructuring', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const { a, b, ...rest } = obj;
      
      expect(a).toBe(1);
      expect(b).toBe(2);
      expect(rest).toEqual({ c: 3 });
    });
    
    test('should support template literals', () => {
      const name = 'claude-test';
      const version = '1.0.0';
      const template = `Package ${name} version ${version}`;
      
      expect(template).toBe('Package claude-test version 1.0.0');
    });
    
    test('should support arrow functions', () => {
      const numbers = [1, 2, 3, 4, 5];
      const doubled = numbers.map(n => n * 2);
      
      expect(doubled).toEqual([2, 4, 6, 8, 10]);
    });
    
    test('should support classes', () => {
      class TestClass {
        constructor(value) {
          this.value = value;
        }
        
        getValue() {
          return this.value;
        }
      }
      
      const instance = new TestClass('test');
      expect(instance.getValue()).toBe('test');
    });
  });
  
  describe('Built-in Modules Compatibility', () => {
    test('should have access to fs module', () => {
      const fs = require('fs');
      expect(typeof fs.readFileSync).toBe('function');
      expect(typeof fs.writeFileSync).toBe('function');
      expect(typeof fs.existsSync).toBe('function');
    });
    
    test('should have access to path module', () => {
      const path = require('path');
      expect(typeof path.join).toBe('function');
      expect(typeof path.resolve).toBe('function');
      expect(typeof path.dirname).toBe('function');
    });
    
    test('should have access to child_process module', () => {
      const { execSync, spawn } = require('child_process');
      expect(typeof execSync).toBe('function');
      expect(typeof spawn).toBe('function');
    });
    
    test('should have access to os module', () => {
      const os = require('os');
      expect(typeof os.platform).toBe('function');
      expect(typeof os.tmpdir).toBe('function');
      expect(typeof os.homedir).toBe('function');
    });
  });
  
  describe('Package Dependencies Compatibility', () => {
    test('should load commander package', () => {
      const { Command } = require('commander');
      expect(typeof Command).toBe('function');
      
      const program = new Command();
      expect(typeof program.version).toBe('function');
      expect(typeof program.command).toBe('function');
    });
    
    test('should load fs-extra package', () => {
      const fs = require('fs-extra');
      expect(typeof fs.copy).toBe('function');
      expect(typeof fs.ensureDir).toBe('function');
      expect(typeof fs.readJSON).toBe('function');
      expect(typeof fs.writeJSON).toBe('function');
    });
    
    test('should load semver package', () => {
      const semver = require('semver');
      expect(typeof semver.valid).toBe('function');
      expect(typeof semver.compare).toBe('function');
      expect(typeof semver.satisfies).toBe('function');
    });
    
    test('should load chalk package', () => {
      const chalk = require('chalk');
      expect(typeof chalk.red).toBe('function');
      expect(typeof chalk.green).toBe('function');
      expect(typeof chalk.blue).toBe('function');
    });
    
    test('should load ora package', () => {
      const ora = require('ora');
      expect(typeof ora).toBe('function');
      
      const spinner = ora('Test');
      expect(typeof spinner.start).toBe('function');
      expect(typeof spinner.stop).toBe('function');
    });
  });
  
  describe('File System Operations', () => {
    test('should handle file paths correctly', async () => {
      const testPath = path.join(__dirname, 'test-file.txt');
      const testContent = 'Node.js compatibility test';
      
      await fs.writeFile(testPath, testContent);
      expect(await fs.pathExists(testPath)).toBe(true);
      
      const content = await fs.readFile(testPath, 'utf8');
      expect(content).toBe(testContent);
      
      await fs.remove(testPath);
      expect(await fs.pathExists(testPath)).toBe(false);
    });
    
    test('should handle JSON operations', async () => {
      const testPath = path.join(__dirname, 'test-data.json');
      const testData = {
        version: nodeVersion,
        platform: process.platform,
        arch: process.arch
      };
      
      await fs.writeJSON(testPath, testData);
      expect(await fs.pathExists(testPath)).toBe(true);
      
      const data = await fs.readJSON(testPath);
      expect(data).toEqual(testData);
      
      await fs.remove(testPath);
    });
  });
  
  describe('Error Handling Compatibility', () => {
    test('should handle promise rejections', async () => {
      const failingPromise = async () => {
        throw new Error('Test error');
      };
      
      await expect(failingPromise()).rejects.toThrow('Test error');
    });
    
    test('should handle try-catch with async/await', async () => {
      let caughtError = null;
      
      try {
        await new Promise((resolve, reject) => {
          reject(new Error('Async error'));
        });
      } catch (error) {
        caughtError = error;
      }
      
      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError.message).toBe('Async error');
    });
  });
  
  describe('Performance APIs', () => {
    test('should have access to performance APIs', () => {
      const { performance } = require('perf_hooks');
      expect(typeof performance.now).toBe('function');
      
      const start = performance.now();
      const end = performance.now();
      expect(end).toBeGreaterThanOrEqual(start);
    });
    
    test('should support timers', async () => {
      const start = Date.now();
      
      await new Promise(resolve => {
        setTimeout(resolve, 100);
      });
      
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });
  
  describe('CLI Environment', () => {
    test('should have proper CLI environment variables', () => {
      expect(typeof process.argv).toBe('object');
      expect(Array.isArray(process.argv)).toBe(true);
      expect(process.argv.length).toBeGreaterThanOrEqual(2);
    });
    
    test('should have working directory access', () => {
      expect(typeof process.cwd).toBe('function');
      expect(typeof process.chdir).toBe('function');
      
      const cwd = process.cwd();
      expect(typeof cwd).toBe('string');
      expect(cwd.length).toBeGreaterThan(0);
    });
    
    test('should support exit codes', () => {
      expect(typeof process.exit).toBe('function');
      // exitCode may be undefined initially in test environment
      if (process.exitCode !== undefined) {
        expect(typeof process.exitCode).toBe('number');
      }
    });
  });
  
  describe('Encoding Support', () => {
    test('should support UTF-8 encoding', async () => {
      const testPath = path.join(__dirname, 'utf8-test.txt');
      const utf8Content = '测试中文字符 🚀 emoji test';
      
      await fs.writeFile(testPath, utf8Content, 'utf8');
      const content = await fs.readFile(testPath, 'utf8');
      
      expect(content).toBe(utf8Content);
      
      await fs.remove(testPath);
    });
    
    test('should handle Buffer operations', () => {
      const text = 'Buffer test';
      const buffer = Buffer.from(text, 'utf8');
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString('utf8')).toBe(text);
    });
  });
});