const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const VersionManager = require('../../lib/utils/version-manager');

// Mock https module for remote version checking
const https = require('https');
jest.mock('https');

describe('VersionManager', () => {
  let tempDir;
  let originalCwd;
  
  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-version-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Create framework structure
    const claudeDir = path.join(tempDir, '.claude');
    await fs.ensureDir(claudeDir);
    
    const versionData = {
      version: '1.2.0',
      installedAt: new Date().toISOString(),
      cliVersion: '1.2.0',
      installSource: 'claude-test-cli'
    };
    await fs.writeJSON(path.join(claudeDir, '.framework-version'), versionData);
  });
  
  afterEach(async () => {
    // Restore original directory and clean up
    process.chdir(originalCwd);
    if (tempDir) {
      await fs.remove(tempDir);
    }
    jest.clearAllMocks();
  });
  
  describe('getCurrentVersion', () => {
    test('should return current framework version', async () => {
      const version = await VersionManager.getCurrentVersion(tempDir);
      expect(version).toBe('1.2.0');
    });
    
    test('should handle missing version file', async () => {
      await fs.remove(path.join(tempDir, '.claude', '.framework-version'));
      
      const version = await VersionManager.getCurrentVersion(tempDir);
      expect(version).toBeNull();
    });
    
    test('should handle corrupted version file', async () => {
      await fs.writeFile(path.join(tempDir, '.claude', '.framework-version'), 'invalid json');
      
      const version = await VersionManager.getCurrentVersion(tempDir);
      expect(version).toBeNull();
    });
  });
  
  describe('getCliVersion', () => {
    test('should return CLI version from package.json', () => {
      const version = VersionManager.getCliVersion();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });
  
  describe('getVersionInfo', () => {
    test('should return complete version information', async () => {
      const info = await VersionManager.getVersionInfo(tempDir);
      
      expect(info).toHaveProperty('version', '1.2.0');
      expect(info).toHaveProperty('cliVersion');
      expect(info).toHaveProperty('installedAt');
      expect(info).toHaveProperty('installSource', 'claude-test-cli');
    });
    
    test('should handle missing framework', async () => {
      await fs.remove(path.join(tempDir, '.claude'));
      
      const info = await VersionManager.getVersionInfo(tempDir);
      expect(info).toBeNull();
    });
  });
  
  describe('updateVersionFile', () => {
    test('should update version file with new data', async () => {
      await VersionManager.updateVersionFile(tempDir, '1.3.0', '1.2.0');
      
      const updatedData = await fs.readJSON(path.join(tempDir, '.claude', '.framework-version'));
      expect(updatedData.version).toBe('1.3.0');
      expect(updatedData.previousVersion).toBe('1.2.0');
    });
    
    test('should handle update when framework does not exist', async () => {
      await fs.remove(path.join(tempDir, '.claude'));
      
      await expect(VersionManager.updateVersionFile(tempDir, '1.3.0', '1.2.0')).rejects.toThrow();
    });
  });
  
  describe('checkRemoteVersion', () => {
    test('should fetch remote version from npm registry', async () => {
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              'dist-tags': {
                latest: '1.4.0'
              }
            }));
          }
          if (event === 'end') {
            callback();
          }
        })
      };
      
      const mockRequest = {
        on: jest.fn(),
        end: jest.fn()
      };
      
      https.request.mockImplementation((options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });
      
      const version = await VersionManager.checkRemoteVersion();
      
      expect(version).toBe('1.4.0');
      expect(https.request).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'registry.npmjs.org'
        }),
        expect.any(Function)
      );
    });
    
    test('should handle network errors', async () => {
      const mockRequest = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Network error'));
          }
        }),
        setTimeout: jest.fn(),
        end: jest.fn()
      };
      
      https.request.mockImplementation(() => mockRequest);
      
      const result = await VersionManager.checkRemoteVersion();
      expect(result).toBeNull();
    });
    
    test('should handle invalid response status', async () => {
      const mockResponse = {
        statusCode: 404,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback('{"error": "Not found"}');
          }
          if (event === 'end') {
            callback();
          }
        })
      };
      
      const mockRequest = {
        on: jest.fn(),
        setTimeout: jest.fn(),
        end: jest.fn()
      };
      
      https.request.mockImplementation((options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });
      
      const result = await VersionManager.checkRemoteVersion();
      expect(result).toBeNull();
    });
    
    test('should handle malformed registry response', async () => {
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback('{}');
          }
          if (event === 'end') {
            callback();
          }
        })
      };
      
      const mockRequest = {
        on: jest.fn(),
        setTimeout: jest.fn(),
        end: jest.fn()
      };
      
      https.request.mockImplementation((options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });
      
      const result = await VersionManager.checkRemoteVersion();
      expect(result).toBeNull();
    });
  });
  
  describe('isUpdateAvailable', () => {
    test('should detect when update is available', () => {
      const updateAvailable = VersionManager.isUpdateAvailable('1.2.0', '1.3.0');
      expect(updateAvailable).toBe(true);
    });
    
    test('should detect when no update is needed', () => {
      const updateAvailable = VersionManager.isUpdateAvailable('1.2.0', '1.2.0');
      expect(updateAvailable).toBe(false);
    });
    
    test('should handle missing versions', () => {
      expect(VersionManager.isUpdateAvailable(null, '1.3.0')).toBe(false);
      expect(VersionManager.isUpdateAvailable('1.2.0', null)).toBe(false);
    });
  });
  
  describe('checkCompatibility', () => {
    test('should check version compatibility', () => {
      const result = VersionManager.checkCompatibility('1.2.0', '1.2.0');
      expect(result.compatible).toBe(true);
    });
    
    test('should detect incompatible versions', () => {
      const result = VersionManager.checkCompatibility('1.1.0', '1.2.0');
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('newer');
    });
    
    test('should handle missing version information', () => {
      const result = VersionManager.checkCompatibility(null, '1.2.0');
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('Missing version information');
    });
  });
  
  describe('compareVersions', () => {
    test('should compare versions correctly', () => {
      expect(VersionManager.compareVersions('1.2.0', '1.1.0')).toBe(1);
      expect(VersionManager.compareVersions('1.1.0', '1.2.0')).toBe(-1);
      expect(VersionManager.compareVersions('1.1.0', '1.1.0')).toBe(0);
    });
    
    test('should handle pre-release versions', () => {
      expect(VersionManager.compareVersions('1.2.0-beta.1', '1.2.0')).toBe(-1);
      expect(VersionManager.compareVersions('1.2.0', '1.2.0-beta.1')).toBe(1);
    });
    
    test('should handle invalid version formats', () => {
      expect(VersionManager.compareVersions('invalid', '1.0.0')).toBe(0);
      expect(VersionManager.compareVersions('1.0.0', 'invalid')).toBe(0);
    });
  });


  describe('formatVersionDisplay', () => {
    test('should format version info with dates', () => {
      const versionInfo = {
        version: '1.2.0',
        installedAt: '2025-01-01'
      };
      
      const display = VersionManager.formatVersionDisplay(versionInfo);
      
      expect(display.current).toBe('1.2.0');
      expect(display.installed).toBeTruthy();
    });

    test('should handle missing version info', () => {
      const display = VersionManager.formatVersionDisplay(null);
      
      expect(display.current).toBe('Unknown');
      expect(display.installed).toBe('Unknown');
    });
  });
});