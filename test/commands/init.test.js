const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const init = require('../../lib/commands/init');
const FileManager = require('../../lib/utils/file-manager');
// const VersionManager = require('../../lib/utils/version-manager'); // Not used in current tests

// Mock ora to avoid spinner issues in tests
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: ''
  }));
});

describe('init command', () => {
  let tempDir;
  let originalCwd;
  
  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-init-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });
  
  afterEach(async () => {
    // Restore original directory and clean up
    process.chdir(originalCwd);
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });
  
  test('should initialize framework in empty directory', async () => {
    await init({ verbose: true });
    
    // Check if .claude directory was created
    const claudeDir = path.join(tempDir, '.claude');
    expect(await fs.pathExists(claudeDir)).toBe(true);
    
    // Check if version file was created
    const versionFile = path.join(claudeDir, '.framework-version');
    expect(await fs.pathExists(versionFile)).toBe(true);
    
    // Verify version file content
    const versionData = await fs.readJSON(versionFile);
    expect(versionData).toHaveProperty('version');
    expect(versionData).toHaveProperty('installedAt');
    expect(versionData).toHaveProperty('cliVersion');
    expect(versionData.installSource).toBe('claude-test-cli');
  });
  
  test('should not reinitialize if framework exists without force', async () => {
    // First initialization
    await init({ verbose: true });
    
    // Create a test file to check if it gets overwritten
    const testFile = path.join(tempDir, '.claude', 'test-file.txt');
    await fs.writeFile(testFile, 'test content');
    
    // Mock console.log to capture output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Second initialization without force
    await init({ verbose: true });
    
    // Test file should still exist
    expect(await fs.pathExists(testFile)).toBe(true);
    const content = await fs.readFile(testFile, 'utf8');
    expect(content).toBe('test content');
    
    // Should show warning message
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Framework already exists')
    );
    
    consoleSpy.mockRestore();
  });
  
  test('should reinitialize if framework exists with force option', async () => {
    // First initialization
    await init({ verbose: true });
    
    // Create a test file in .claude directory (user file)
    const testFile = path.join(tempDir, '.claude', 'test-file.txt');
    await fs.writeFile(testFile, 'test content');
    
    // Second initialization with force
    await init({ force: true, verbose: true });
    
    // Test file should be preserved (user files are not deleted)
    expect(await fs.pathExists(testFile)).toBe(true);
    
    // Framework should still be properly initialized
    const versionFile = path.join(tempDir, '.claude', '.framework-version');
    expect(await fs.pathExists(versionFile)).toBe(true);
  });
  
  test('should handle initialization errors gracefully', async () => {
    // Mock FileManager to throw an error
    const mockCopyFrameworkFiles = jest.spyOn(FileManager, 'copyFrameworkFiles')
      .mockRejectedValue(new Error('Copy failed'));
    
    await expect(init({ verbose: true })).rejects.toThrow('Copy failed');
    
    mockCopyFrameworkFiles.mockRestore();
  });
  
  test('should show version info when framework already exists', async () => {
    // First initialization
    await init({ verbose: true });
    
    // Mock console.log to capture output
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Try to initialize again
    await init({ verbose: true });
    
    // Should show current version
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Current version')
    );
    
    consoleSpy.mockRestore();
  });
});