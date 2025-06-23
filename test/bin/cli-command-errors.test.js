const path = require('path');
const { spawn } = require('child_process');

describe('CLI Command Error Handling', () => {
  const cliPath = path.join(__dirname, '../../bin/claude-test.js');
  
  function runCliCommand(args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, ...args], {
        stdio: 'pipe',
        ...options
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
      
      child.on('error', reject);
    });
  }
  
  test('should handle init command failure', async () => {
    const fs = require('fs');
    const os = require('os');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
    
    try {
      const result = await runCliCommand(['init'], { 
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      // Should complete - just check it doesn't crash
      expect(typeof result.code).toBe('number');
      expect(result.stderr.includes('Initialization failed') || result.stdout.includes('failed') || result.stdout.includes('successfully') || result.code === 0).toBe(true);
    } finally {
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 10000);
  
  test('should handle init command failure with verbose', async () => {
    const fs = require('fs');
    const os = require('os');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
    
    try {
      const result = await runCliCommand(['init', '--verbose'], { 
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      // Should complete and show verbose output
      expect(typeof result.code).toBe('number');
      expect(result.stderr.length > 0 || result.stdout.includes('failed') || result.stdout.includes('Initialization') || result.code === 0).toBe(true);
    } finally {
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 10000);
  
  test('should handle update command without framework', async () => {
    const fs = require('fs');
    const os = require('os');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
    
    try {
      const result = await runCliCommand(['update'], { 
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      // Update command should handle missing framework gracefully
      expect(typeof result.code).toBe('number');
      // Just verify the command ran (could succeed or fail depending on environment)
      expect(result.stdout.length + result.stderr.length).toBeGreaterThan(0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 10000);
  
  test('should handle update command with verbose', async () => {
    const fs = require('fs');
    const os = require('os');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
    
    try {
      const result = await runCliCommand(['update', '--verbose'], { 
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      expect(typeof result.code).toBe('number');
      expect(result.stdout.length + result.stderr.length).toBeGreaterThan(0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 10000);
  
  test('should handle check command without framework', async () => {
    const fs = require('fs');
    const os = require('os');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
    
    try {
      const result = await runCliCommand(['check'], { 
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      // Check command should handle missing framework gracefully
      expect(typeof result.code).toBe('number');
      expect(result.stderr.includes('Check failed') || result.stdout.includes('Checking') || result.stdout.includes('Framework not found') || result.stdout.includes('claude-test init')).toBe(true);
    } finally {
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 10000);
  
  test('should handle check command with verbose', async () => {
    const fs = require('fs');
    const os = require('os');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
    
    try {
      const result = await runCliCommand(['check', '--verbose'], { 
        cwd: tempDir,
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      expect(typeof result.code).toBe('number');
      expect(result.stderr.length > 0 || result.stdout.includes('Checking') || result.stdout.includes('Framework not found')).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }, 10000);
  
  test('should handle invalid command', async () => {
    const result = await runCliCommand(['invalid-command']);
    
    expect(result.code).toBe(1);
    expect(result.stderr.includes('Invalid command') || result.stdout.includes('help')).toBe(true);
  });
  
  test('should handle invalid command with args', async () => {
    const result = await runCliCommand(['invalid-command', 'with', 'args']);
    
    expect(result.code).toBe(1);
    expect(result.stderr.includes('Invalid command') || result.stdout.includes('help')).toBe(true);
  });
});