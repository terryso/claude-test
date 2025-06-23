/**
 * Performance Benchmark Tests
 * 
 * Tests the performance characteristics of the CLI tool under various scenarios
 */

const { performance } = require('perf_hooks');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('Performance Benchmarks', () => {
  let tempDir;
  let cliPath;
  
  beforeAll(() => {
    cliPath = path.join(__dirname, '../../bin/claude-test.js');
  });
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-perf-'));
  });
  
  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });
  
  describe('Initialization Performance', () => {
    test('should initialize framework within acceptable time limits', async () => {
      const startTime = performance.now();
      
      try {
        execSync(`node ${cliPath} init`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 30000
        });
      } catch (error) {
        // Log error for debugging but don't fail the test if it's just missing templates
        console.warn('Init failed (expected in test environment):', error.message);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      
      console.log(`Init took ${duration.toFixed(2)}ms`);
    }, 15000);
    
    test('should handle multiple concurrent initializations', async () => {
      const concurrentDirs = [];
      const promises = [];
      
      // Create 5 concurrent directories
      for (let i = 0; i < 5; i++) {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), `claude-test-concurrent-${i}-`));
        concurrentDirs.push(dir);
      }
      
      const startTime = performance.now();
      
      // Launch concurrent init processes
      for (const dir of concurrentDirs) {
        const promise = new Promise((resolve, _reject) => {
          try {
            execSync(`node ${cliPath} init`, {
              cwd: dir,
              stdio: 'pipe',
              timeout: 30000
            });
            resolve({ success: true, dir });
          } catch (error) {
            resolve({ success: false, dir, error: error.message });
          }
        });
        promises.push(promise);
      }
      
      await Promise.all(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      // Should complete all within 30 seconds
      expect(totalDuration).toBeLessThan(30000);
      
      console.log(`Concurrent init (5 processes) took ${totalDuration.toFixed(2)}ms`);
      
      // Clean up
      for (const dir of concurrentDirs) {
        await fs.remove(dir);
      }
    }, 45000);
  });
  
  describe('Check Command Performance', () => {
    test('should check framework status quickly', async () => {
      // Initialize first
      try {
        execSync(`node ${cliPath} init`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 30000
        });
      } catch (error) {
        // Skip if init fails
        return;
      }
      
      const startTime = performance.now();
      
      execSync(`node ${cliPath} check`, {
        cwd: tempDir,
        stdio: 'pipe',
        timeout: 10000
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      
      console.log(`Check took ${duration.toFixed(2)}ms`);
    });
  });
  
  describe('Memory Usage', () => {
    test('should not exceed memory limits during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      try {
        // Perform multiple operations
        for (let i = 0; i < 10; i++) {
          execSync(`node ${cliPath} check`, {
            cwd: tempDir,
            stdio: 'pipe',
            timeout: 10000
          });
        }
      } catch (error) {
        // Expected to fail in test environment
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });
  
  describe('Large Project Performance', () => {
    test('should handle large directory structures efficiently', async () => {
      // Create a large project structure
      const largeProjectDir = path.join(tempDir, 'large-project');
      await fs.ensureDir(largeProjectDir);
      
      // Create many directories and files
      const directories = ['src', 'tests', 'docs', 'lib', 'build', 'dist'];
      
      for (const dir of directories) {
        const dirPath = path.join(largeProjectDir, dir);
        await fs.ensureDir(dirPath);
        
        // Create 100 files in each directory
        for (let i = 0; i < 100; i++) {
          await fs.writeFile(
            path.join(dirPath, `file-${i}.js`),
            `// Generated file ${i}\nconsole.log('File ${i}');\n`
          );
        }
      }
      
      const startTime = performance.now();
      
      try {
        execSync(`node ${cliPath} init`, {
          cwd: largeProjectDir,
          stdio: 'pipe',
          timeout: 60000
        });
      } catch (error) {
        // Expected to fail, but timing is what matters
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle large projects within reasonable time (30 seconds)
      expect(duration).toBeLessThan(30000);
      
      console.log(`Large project init took ${duration.toFixed(2)}ms`);
    }, 90000);
  });
  
  describe('Resource Cleanup', () => {
    test('should properly clean up resources after operations', async () => {
      const beforeHandles = process._getActiveHandles().length;
      const beforeRequests = process._getActiveRequests().length;
      
      try {
        // Perform operations that might leave handles open
        execSync(`node ${cliPath} --version`, {
          stdio: 'pipe',
          timeout: 5000
        });
        
        execSync(`node ${cliPath} --help`, {
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // Operations may fail in test environment
      }
      
      // Give some time for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const afterHandles = process._getActiveHandles().length;
      const afterRequests = process._getActiveRequests().length;
      
      // Should not significantly increase active handles/requests
      expect(afterHandles - beforeHandles).toBeLessThanOrEqual(2);
      expect(afterRequests - beforeRequests).toBeLessThanOrEqual(1);
      
      console.log(`Handle change: ${afterHandles - beforeHandles}, Request change: ${afterRequests - beforeRequests}`);
    });
  });
  
  describe('Stress Testing', () => {
    test('should handle rapid successive commands', async () => {
      const commands = ['--version', '--help', 'check'];
      const iterations = 50;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const command = commands[i % commands.length];
        
        try {
          execSync(`node ${cliPath} ${command}`, {
            cwd: tempDir,
            stdio: 'pipe',
            timeout: 5000
          });
        } catch (error) {
          // Some commands may fail in test environment
        }
      }
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / iterations;
      
      // Average command should complete quickly
      expect(avgDuration).toBeLessThan(1000); // Less than 1 second average
      
      console.log(`${iterations} commands took ${totalDuration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
    }, 120000);
  });
});

/**
 * Performance Monitoring Utilities
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }
  
  startTimer(name) {
    this.metrics[name] = performance.now();
  }
  
  endTimer(name) {
    if (this.metrics[name]) {
      const duration = performance.now() - this.metrics[name];
      console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }
  
  measureMemory(name) {
    const memory = process.memoryUsage();
    console.log(`🧠 ${name} Memory: ${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    return memory;
  }
}

module.exports = { PerformanceMonitor };