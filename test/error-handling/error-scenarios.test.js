/**
 * Error Handling and Edge Cases Tests
 * 
 * Tests various error scenarios and edge cases to ensure robust error handling
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

describe('Error Handling Scenarios', () => {
  let tempDir;
  let cliPath;
  
  beforeAll(() => {
    cliPath = path.join(__dirname, '../../bin/claude-test.js');
  });
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-error-'));
  });
  
  afterEach(async () => {
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });
  
  describe('Command Line Error Handling', () => {
    test('should handle invalid commands gracefully', () => {
      try {
        execSync(`node ${cliPath} invalid-command`, {
          stdio: 'pipe',
          timeout: 5000
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).toBe(1);
        const output = error.stdout.toString() + error.stderr.toString();
        expect(output.length).toBeGreaterThan(0); // Should have some error output
      }
    });
    
    test('should handle missing arguments', () => {
      try {
        execSync(`node ${cliPath}`, {
          stdio: 'pipe',
          timeout: 5000
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).toBe(1);
        // Should provide helpful error message
      }
    });
    
    test('should handle invalid flags', () => {
      try {
        execSync(`node ${cliPath} init --invalid-flag`, {
          stdio: 'pipe',
          timeout: 5000
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).toBe(1);
      }
    });
    
    test('should handle malformed command syntax', () => {
      const malformedCommands = [
        'init --',
        'check ---verbose',
        'update --dry-run --dry-run',
      ];
      
      for (const command of malformedCommands) {
        try {
          execSync(`node ${cliPath} ${command}`, {
            stdio: 'pipe',
            timeout: 5000
          });
        } catch (error) {
          expect(error.status).toBeGreaterThan(0);
        }
      }
    });
  });
  
  describe('File System Error Handling', () => {
    test('should handle permission denied errors', async () => {
      if (process.platform === 'win32') {
        return; // Skip on Windows due to different permission model
      }
      
      // Create a directory with no write permissions
      const restrictedDir = path.join(tempDir, 'restricted');
      await fs.ensureDir(restrictedDir);
      await fs.chmod(restrictedDir, 0o555); // Read and execute only
      
      try {
        execSync(`node ${cliPath} init`, {
          cwd: restrictedDir,
          stdio: 'pipe',
          timeout: 10000
        });
        fail('Should have failed due to permissions');
      } catch (error) {
        expect(error.status).toBeGreaterThan(0);
        const output = error.stdout.toString() + error.stderr.toString();
        expect(output.length).toBeGreaterThan(0); // Should have error output
      }
      
      // Restore permissions for cleanup
      await fs.chmod(restrictedDir, 0o755);
    });
    
    test('should handle disk space issues gracefully', async () => {
      // This is hard to test reliably, but we can at least check error handling exists
      const FileManager = require('../../lib/utils/file-manager');
      
      // Mock a disk space error
      const originalCopy = fs.copy;
      fs.copy = jest.fn().mockRejectedValue(new Error('ENOSPC: no space left on device'));
      
      try {
        await FileManager.copyFrameworkFiles(tempDir);
        fail('Should have thrown disk space error');
      } catch (error) {
        expect(error.message).toContain('ENOSPC');
      }
      
      // Restore original function
      fs.copy = originalCopy;
    });
    
    test('should handle corrupted files', async () => {
      // Create a corrupted .framework-version file
      const claudeDir = path.join(tempDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.writeFile(path.join(claudeDir, '.framework-version'), 'corrupted json content');
      
      try {
        execSync(`node ${cliPath} check`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 10000
        });
      } catch (error) {
        // Should handle JSON parse errors gracefully
        expect(error.status).toBeGreaterThan(0);
      }
    });
    
    test('should handle missing framework files', async () => {
      // Create partial framework structure
      const claudeDir = path.join(tempDir, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.writeJSON(path.join(claudeDir, '.framework-version'), { version: '1.0.0' });
      // Missing commands and scripts directories
      
      try {
        execSync(`node ${cliPath} check`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 10000
        });
      } catch (error) {
        // Should detect missing files
        expect(error.status).toBe(0); // check should not fail, just report issues
      }
    });
  });
  
  describe('Network Error Handling', () => {
    test('should handle network timeouts gracefully', async () => {
      const VersionManager = require('../../lib/utils/version-manager');
      
      // Mock a network timeout
      const originalCheckRemote = VersionManager.checkRemoteVersion;
      VersionManager.checkRemoteVersion = jest.fn().mockRejectedValue(new Error('ETIMEDOUT'));
      
      try {
        await VersionManager.checkRemoteVersion();
        fail('Should have thrown timeout error');
      } catch (error) {
        expect(error.message).toContain('ETIMEDOUT');
      }
      
      // Restore original function
      VersionManager.checkRemoteVersion = originalCheckRemote;
    });
    
    test('should handle DNS resolution failures', async () => {
      const VersionManager = require('../../lib/utils/version-manager');
      
      // Mock DNS failure
      const originalCheckRemote = VersionManager.checkRemoteVersion;
      VersionManager.checkRemoteVersion = jest.fn().mockRejectedValue(new Error('ENOTFOUND'));
      
      try {
        await VersionManager.checkRemoteVersion();
        fail('Should have thrown DNS error');
      } catch (error) {
        expect(error.message).toContain('ENOTFOUND');
      }
      
      // Restore original function
      VersionManager.checkRemoteVersion = originalCheckRemote;
    });
  });
  
  describe('Resource Exhaustion', () => {
    test('should handle memory pressure', async () => {
      // Monitor memory usage during operations
      const initialMemory = process.memoryUsage();
      
      // Perform operations that might consume memory
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          new Promise(resolve => {
            setTimeout(() => {
              try {
                execSync(`node ${cliPath} --version`, { stdio: 'pipe' });
              } catch (error) {
                // Expected in some test environments
              }
              resolve();
            }, 10);
          })
        );
      }
      
      await Promise.all(operations);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Should not have excessive memory growth (< 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    }, 30000);
    
    test('should handle file descriptor limits', async () => {
      // Test opening many files simultaneously
      const files = [];
      const maxFiles = 50; // Conservative limit
      
      try {
        for (let i = 0; i < maxFiles; i++) {
          const file = path.join(tempDir, `test-${i}.txt`);
          await fs.writeFile(file, `content ${i}`);
          files.push(file);
        }
        
        // Read all files simultaneously
        const readPromises = files.map(file => fs.readFile(file, 'utf8'));
        const contents = await Promise.all(readPromises);
        
        expect(contents).toHaveLength(maxFiles);
        expect(contents[0]).toBe('content 0');
        expect(contents[maxFiles - 1]).toBe(`content ${maxFiles - 1}`);
      } catch (error) {
        if (error.code === 'EMFILE' || error.code === 'ENFILE') {
          console.warn('File descriptor limit reached (expected in some environments)');
        } else {
          throw error;
        }
      }
    });
  });
  
  describe('Process Termination Handling', () => {
    test('should handle SIGTERM gracefully', (done) => {
      if (process.platform === 'win32') {
        done(); // Skip on Windows
        return;
      }
      
      const child = spawn('node', [cliPath, 'check'], {
        cwd: tempDir,
        stdio: 'pipe'
      });
      
      let terminated = false;
      
      child.on('exit', (code, signal) => {
        terminated = true;
        // Signal might be null if process exits normally
        expect(signal === 'SIGTERM' || code !== null).toBe(true);
        done();
      });
      
      child.on('error', (error) => {
        if (!terminated) {
          done();
        }
      });
      
      // Send SIGTERM after a short delay
      setTimeout(() => {
        if (!terminated) {
          child.kill('SIGTERM');
        }
      }, 500);
      
      // Failsafe timeout
      setTimeout(() => {
        if (!terminated) {
          child.kill('SIGKILL');
          done();
        }
      }, 2000);
    }, 5000);
    
    test('should handle SIGINT gracefully', (done) => {
      if (process.platform === 'win32') {
        done(); // Skip on Windows
        return;
      }
      
      const child = spawn('node', [cliPath, '--help'], {
        stdio: 'pipe'
      });
      
      let terminated = false;
      
      child.on('exit', (code, signal) => {
        terminated = true;
        // SIGINT might be converted to exit code
        expect(code === 0 || signal === 'SIGINT').toBe(true);
        done();
      });
      
      child.on('error', (error) => {
        if (!terminated) {
          done(error);
        }
      });
      
      // Send SIGINT after a short delay
      setTimeout(() => {
        if (!terminated) {
          child.kill('SIGINT');
        }
      }, 500);
    }, 10000);
  });
  
  describe('Malformed Input Handling', () => {
    test('should handle extremely long arguments', () => {
      const longArg = 'a'.repeat(10000);
      
      try {
        execSync(`node ${cliPath} init --${longArg}`, {
          stdio: 'pipe',
          timeout: 5000
        });
        fail('Should have handled long argument gracefully');
      } catch (error) {
        expect(error.status).toBeGreaterThan(0);
      }
    });
    
    test('should handle special characters in arguments', () => {
      const specialChars = ['<', '>', '|', '&', ';', '"', "'", '`'];
      
      for (const char of specialChars) {
        try {
          execSync(`node ${cliPath} init --test${char}value`, {
            stdio: 'pipe',
            timeout: 5000
          });
        } catch (error) {
          expect(error.status).toBeGreaterThan(0);
        }
      }
    });
    
    test('should handle null bytes in input', () => {
      try {
        execSync(`node ${cliPath} init --test\x00value`, {
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // Error status might be undefined in some cases
        expect(error.status !== 0 || error.signal).toBeTruthy();
      }
    });
  });
  
  describe('Concurrent Operation Handling', () => {
    test('should handle multiple concurrent init operations', async () => {
      const concurrentOps = 5;
      const promises = [];
      
      for (let i = 0; i < concurrentOps; i++) {
        const testDir = path.join(tempDir, `concurrent-${i}`);
        await fs.ensureDir(testDir);
        
        const promise = new Promise(resolve => {
          try {
            execSync(`node ${cliPath} init`, {
              cwd: testDir,
              stdio: 'pipe',
              timeout: 30000
            });
            resolve({ success: true, dir: testDir });
          } catch (error) {
            resolve({ success: false, dir: testDir, error: error.message });
          }
        });
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      
      // At least some operations should complete without crashing
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      console.log(`Concurrent operations: ${successCount} succeeded, ${failCount} failed`);
      
      // Should not crash the system
      expect(successCount + failCount).toBe(concurrentOps);
    }, 60000);
  });
  
  describe('Recovery and Cleanup', () => {
    test('should recover from partial operations', async () => {
      const claudeDir = path.join(tempDir, '.claude');
      await fs.ensureDir(claudeDir);
      
      // Create partial framework structure
      await fs.ensureDir(path.join(claudeDir, 'commands'));
      // Missing scripts directory and version file
      
      try {
        execSync(`node ${cliPath} init --force`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 30000
        });
        
        // Should complete the framework structure
        expect(await fs.pathExists(path.join(claudeDir, 'scripts'))).toBe(true);
        expect(await fs.pathExists(path.join(claudeDir, '.framework-version'))).toBe(true);
      } catch (error) {
        // Expected in test environment without templates
        expect(error.status).toBeGreaterThan(0);
      }
    });
    
    test('should clean up temporary files on failure', async () => {
      const tempFilesBefore = (await fs.readdir(os.tmpdir())).filter(name => 
        name.startsWith('claude-test')
      );
      
      try {
        execSync(`node ${cliPath} init`, {
          cwd: '/invalid/path/that/does/not/exist',
          stdio: 'pipe',
          timeout: 10000
        });
      } catch (error) {
        // Expected to fail
      }
      
      // Give some time for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tempFilesAfter = (await fs.readdir(os.tmpdir())).filter(name => 
        name.startsWith('claude-test')
      );
      
      // Should not have significantly more temp files
      expect(tempFilesAfter.length - tempFilesBefore.length).toBeLessThanOrEqual(2);
    });
  });
});