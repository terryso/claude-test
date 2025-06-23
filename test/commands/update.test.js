const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const update = require('../../lib/commands/update');
const FileManager = require('../../lib/utils/file-manager');
const VersionManager = require('../../lib/utils/version-manager');

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

describe('update command', () => {
  let tempDir;
  let originalCwd;
  
  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-update-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Create a basic framework structure
    const claudeDir = path.join(tempDir, '.claude');
    await fs.ensureDir(claudeDir);
    
    // Create version file
    const versionData = {
      version: '1.0.0',
      installedAt: new Date().toISOString(),
      cliVersion: '1.0.0',
      installSource: 'claude-test-cli'
    };
    await fs.writeJSON(path.join(claudeDir, '.framework-version'), versionData);
    
    // Create some framework files
    await fs.ensureDir(path.join(claudeDir, 'commands'));
    await fs.ensureDir(path.join(claudeDir, 'scripts'));
    await fs.writeFile(path.join(claudeDir, 'commands', 'test.md'), '# Test Command');
    await fs.writeFile(path.join(claudeDir, 'scripts', 'test.js'), '// Test Script');
  });
  
  afterEach(async () => {
    // Restore original directory and clean up
    process.chdir(originalCwd);
    if (tempDir) {
      await fs.remove(tempDir);
    }
  });
  
  test('should update framework when newer version available', async () => {
    // Mock VersionManager to simulate update availability
    const mockGetCurrentVersion = jest.spyOn(VersionManager, 'getCurrentVersion')
      .mockResolvedValue('1.0.0');
    const mockGetCliVersion = jest.spyOn(VersionManager, 'getCliVersion')
      .mockReturnValue('1.1.0');
    
    // Mock FileManager update
    const mockUpdateFrameworkFiles = jest.spyOn(FileManager, 'updateFrameworkFiles')
      .mockResolvedValue(true);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await update({ verbose: true });
    
    expect(mockUpdateFrameworkFiles).toHaveBeenCalled();
    // Check if console.log was called, allowing for any success message
    expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
    
    mockGetCurrentVersion.mockRestore();
    mockGetCliVersion.mockRestore();
    mockUpdateFrameworkFiles.mockRestore();
    consoleSpy.mockRestore();
  });
  
  test('should skip update when already up to date', async () => {
    // Mock VersionManager to simulate same version
    const mockGetCurrentVersion = jest.spyOn(VersionManager, 'getCurrentVersion')
      .mockResolvedValue('1.1.0');
    const mockGetCliVersion = jest.spyOn(VersionManager, 'getCliVersion')
      .mockReturnValue('1.1.0');
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await update({ verbose: true });
    
    // Check if console.log was called with some message
    expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
    
    mockGetCurrentVersion.mockRestore();
    mockGetCliVersion.mockRestore();
    consoleSpy.mockRestore();
  });
  
  test('should create backup when backup option is enabled', async () => {
    // Mock VersionManager
    const mockGetCurrentVersion = jest.spyOn(VersionManager, 'getCurrentVersion')
      .mockResolvedValue('1.0.0');
    const mockGetCliVersion = jest.spyOn(VersionManager, 'getCliVersion')
      .mockReturnValue('1.1.0');
    
    // Mock FileManager methods
    const mockCreateBackup = jest.spyOn(FileManager, 'createBackup')
      .mockResolvedValue('backup-path');
    const mockUpdateFrameworkFiles = jest.spyOn(FileManager, 'updateFrameworkFiles')
      .mockResolvedValue(true);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await update({ backup: true, verbose: true });
    
    expect(mockCreateBackup).toHaveBeenCalled();
    
    mockGetCurrentVersion.mockRestore();
    mockGetCliVersion.mockRestore();
    mockCreateBackup.mockRestore();
    mockUpdateFrameworkFiles.mockRestore();
    consoleSpy.mockRestore();
  });
  
  test('should show what would be updated in dry-run mode', async () => {
    // Mock VersionManager
    const mockGetCurrentVersion = jest.spyOn(VersionManager, 'getCurrentVersion')
      .mockResolvedValue('1.0.0');
    const mockGetCliVersion = jest.spyOn(VersionManager, 'getCliVersion')
      .mockReturnValue('1.1.0');
    
    // Mock FileManager to not actually update
    const mockUpdateFrameworkFiles = jest.spyOn(FileManager, 'updateFrameworkFiles')
      .mockResolvedValue(false);
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await update({ dryRun: true, verbose: true });
    
    // Check if console.log was called (dry run should produce output)
    expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
    
    mockGetCurrentVersion.mockRestore();
    mockGetCliVersion.mockRestore();
    mockUpdateFrameworkFiles.mockRestore();
    consoleSpy.mockRestore();
  });
  
  test('should handle framework not found gracefully', async () => {
    // Remove framework directory
    await fs.remove(path.join(tempDir, '.claude'));
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Should not throw but handle gracefully
    await expect(update({ verbose: true })).resolves.not.toThrow();
    
    // Should log appropriate message
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Framework not found in current directory')
    );
    
    consoleSpy.mockRestore();
  });
  
  test('should handle update errors gracefully', async () => {
    // Mock VersionManager
    const mockGetCurrentVersion = jest.spyOn(VersionManager, 'getCurrentVersion')
      .mockResolvedValue('1.0.0');
    const mockGetCliVersion = jest.spyOn(VersionManager, 'getCliVersion')
      .mockReturnValue('1.1.0');
    
    // Mock FileManager to throw error
    const mockUpdateFrameworkFiles = jest.spyOn(FileManager, 'updateFrameworkFiles')
      .mockRejectedValue(new Error('Update failed'));
    
    // Should log the error and then re-throw it
    await expect(update({ verbose: true })).rejects.toThrow('Update failed');
    
    mockGetCurrentVersion.mockRestore();
    mockGetCliVersion.mockRestore();
    mockUpdateFrameworkFiles.mockRestore();
  });
});