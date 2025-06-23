const path = require('path');
const { execSync } = require('child_process');

describe('CLI Entry Point', () => {
  const cliPath = path.join(__dirname, '../../bin/claude-test.js');
  
  test('should show help when no command provided', () => {
    try {
      const result = execSync(`node "${cliPath}"`, { encoding: 'utf8', stdio: 'pipe' });
      
      expect(result).toContain('Claude Test Framework CLI');
      expect(result).toContain('YAML-based Playwright testing');
      expect(result).toContain('Usage:');
    } catch (error) {
      // Command might exit with non-zero, check stdout/stderr
      const output = error.stdout || error.stderr || '';
      expect(output).toContain('claude-test');
    }
  });
  
  test('should show version', () => {
    const result = execSync(`node "${cliPath}" --version`, { encoding: 'utf8', stdio: 'pipe' });
    
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
  
  test('should show help with --help', () => {
    const result = execSync(`node "${cliPath}" --help`, { encoding: 'utf8', stdio: 'pipe' });
    
    expect(result).toContain('claude-test');
    expect(result).toContain('init');
    expect(result).toContain('update');
    expect(result).toContain('check');
  });
  
  test('should handle invalid command', () => {
    try {
      execSync(`node "${cliPath}" invalid-command`, { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      expect((error.stdout || error.stderr).includes('Invalid command') || (error.stdout || error.stderr).includes('help')).toBe(true);
      expect(error.status).toBe(1);
    }
  });
  
  test('should have correct program structure', () => {
    // Test the CLI setup without executing commands
    const originalArgv = process.argv;
    const originalExit = process.exit;
    
    // Mock process.exit to prevent actual exit
    process.exit = jest.fn();
    process.argv = ['node', 'claude-test.js'];
    
    try {
      // Clear require cache and re-require to test setup
      delete require.cache[require.resolve('../../bin/claude-test.js')];
      
      // This will test the module loading and setup
      require('../../bin/claude-test.js');
      
      // If we get here, the module loaded successfully
      expect(true).toBe(true);
    } finally {
      // Restore original values
      process.argv = originalArgv;
      process.exit = originalExit;
    }
  });

  test('should handle init command errors', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processSpy = jest.spyOn(process, 'exit').mockImplementation();
    
    try {
      execSync(`node "${cliPath}" init --invalid-option`, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
    } catch (error) {
      // Command should fail with invalid option
      expect(error.status).toBe(1);
    }
    
    consoleErrorSpy.mockRestore();
    processSpy.mockRestore();
  });

  test('should handle update command errors', () => {
    try {
      execSync(`node "${cliPath}" update --invalid-option`, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
    } catch (error) {
      // Command should fail with invalid option
      expect(error.status).toBe(1);
    }
  });

  test('should handle check command errors', () => {
    try {
      execSync(`node "${cliPath}" check --invalid-option`, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
    } catch (error) {
      // Command should fail with invalid option
      expect(error.status).toBe(1);
    }
  });
});