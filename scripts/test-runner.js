#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * Comprehensive test runner for the claude-test CLI tool.
 * Runs different types of tests based on environment and configuration.
 */

const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      e2e: null,
      performance: null,
      compatibility: null,
      errorHandling: null,
      coverage: null
    };
    
    this.config = {
      runUnit: true,
      runIntegration: true,
      runE2E: process.env.RUN_E2E_TESTS === 'true',
      runPerformance: process.env.RUN_PERFORMANCE_TESTS === 'true',
      runCompatibility: process.env.RUN_COMPATIBILITY_TESTS !== 'false',
      runErrorHandling: process.env.RUN_ERROR_TESTS !== 'false',
      runCoverage: process.env.RUN_COVERAGE !== 'false',
      verbose: process.env.VERBOSE === 'true',
      ci: process.env.CI === 'true'
    };
  }
  
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? chalk.red('❌') : 
                   type === 'success' ? chalk.green('✅') : 
                   type === 'warning' ? chalk.yellow('⚠️') : 
                   chalk.blue('ℹ️');
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }
  
  async runCommand(command, options = {}) {
    this.log(`Running: ${command}`, 'info');
    
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: this.config.verbose ? 'inherit' : 'pipe',
        timeout: options.timeout || 120000,
        ...options
      });
      
      return { success: true, output };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
        code: error.status
      };
    }
  }
  
  async runUnitTests() {
    this.log('Running unit tests...', 'info');
    
    const result = await this.runCommand('npm run test -- --testPathPattern="test/(commands|utils)"');
    this.results.unit = result;
    
    if (result.success) {
      this.log('Unit tests passed!', 'success');
    } else {
      this.log(`Unit tests failed: ${result.error}`, 'error');
    }
    
    return result.success;
  }
  
  async runIntegrationTests() {
    this.log('Running integration tests...', 'info');
    
    const result = await this.runCommand('npm run test -- --testPathPattern="test/integration"');
    this.results.integration = result;
    
    if (result.success) {
      this.log('Integration tests passed!', 'success');
    } else {
      this.log(`Integration tests failed: ${result.error}`, 'error');
    }
    
    return result.success;
  }
  
  async runE2ETests() {
    if (!this.config.runE2E) {
      this.log('E2E tests skipped (set RUN_E2E_TESTS=true to enable)', 'warning');
      return true;
    }
    
    this.log('Running E2E tests...', 'info');
    
    const result = await this.runCommand('npm run test -- --testPathPattern="test/cli-e2e.test.js"', {
      env: { ...process.env, RUN_E2E_TESTS: 'true' }
    });
    
    this.results.e2e = result;
    
    if (result.success) {
      this.log('E2E tests passed!', 'success');
    } else {
      this.log(`E2E tests failed: ${result.error}`, 'error');
    }
    
    return result.success;
  }
  
  async runPerformanceTests() {
    if (!this.config.runPerformance) {
      this.log('Performance tests skipped (set RUN_PERFORMANCE_TESTS=true to enable)', 'warning');
      return true;
    }
    
    this.log('Running performance tests...', 'info');
    
    const result = await this.runCommand('npm run test:performance');
    this.results.performance = result;
    
    if (result.success) {
      this.log('Performance tests passed!', 'success');
    } else {
      this.log(`Performance tests failed: ${result.error}`, 'error');
    }
    
    return result.success;
  }
  
  async runCompatibilityTests() {
    if (!this.config.runCompatibility) {
      this.log('Compatibility tests skipped', 'warning');
      return true;
    }
    
    this.log('Running compatibility tests...', 'info');
    
    const result = await this.runCommand('npm run test:compatibility');
    this.results.compatibility = result;
    
    if (result.success) {
      this.log('Compatibility tests passed!', 'success');
    } else {
      this.log(`Compatibility tests failed: ${result.error}`, 'error');
    }
    
    return result.success;
  }
  
  async runErrorHandlingTests() {
    if (!this.config.runErrorHandling) {
      this.log('Error handling tests skipped', 'warning');
      return true;
    }
    
    this.log('Running error handling tests...', 'info');
    
    const result = await this.runCommand('npm run test:error-handling');
    this.results.errorHandling = result;
    
    if (result.success) {
      this.log('Error handling tests passed!', 'success');
    } else {
      this.log(`Error handling tests failed: ${result.error}`, 'error');
    }
    
    return result.success;
  }
  
  async runCoverageTests() {
    if (!this.config.runCoverage) {
      this.log('Coverage tests skipped', 'warning');
      return true;
    }
    
    this.log('Running tests with coverage...', 'info');
    
    const result = await this.runCommand('npm run test:coverage');
    this.results.coverage = result;
    
    if (result.success) {
      this.log('Coverage tests passed!', 'success');
    } else {
      this.log(`Coverage tests failed: ${result.error}`, 'error');
    }
    
    return result.success;
  }
  
  async runLinting() {
    this.log('Running linting...', 'info');
    
    const result = await this.runCommand('npm run lint');
    
    if (result.success) {
      this.log('Linting passed!', 'success');
    } else {
      this.log(`Linting failed: ${result.error}`, 'error');
    }
    
    return result.success;
  }
  
  async generateReport() {
    this.log('Generating test report...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        npm: execSync('npm --version', { encoding: 'utf8' }).trim(),
        os: process.platform,
        ci: this.config.ci
      },
      configuration: this.config,
      results: this.results,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
    
    // Calculate summary
    Object.values(this.results).forEach(result => {
      if (result === null) {
        report.summary.skipped++;
      } else if (result.success) {
        report.summary.passed++;
      } else {
        report.summary.failed++;
      }
      report.summary.total++;
    });
    
    // Write report to file
    const reportsDir = path.join(process.cwd(), 'test-reports');
    await fs.ensureDir(reportsDir);
    
    const reportFile = path.join(reportsDir, `test-report-${Date.now()}.json`);
    await fs.writeJSON(reportFile, report, { spaces: 2 });
    
    this.log(`Test report saved to: ${reportFile}`, 'info');
    
    // Print summary
    console.log('\n' + chalk.bold('TEST SUMMARY'));
    console.log('━'.repeat(50));
    console.log(`Total test suites: ${report.summary.total}`);
    console.log(`${chalk.green('Passed:')} ${report.summary.passed}`);
    console.log(`${chalk.red('Failed:')} ${report.summary.failed}`);
    console.log(`${chalk.yellow('Skipped:')} ${report.summary.skipped}`);
    
    return report;
  }
  
  async run() {
    this.log('Starting comprehensive test suite...', 'info');
    
    const startTime = Date.now();
    let allPassed = true;
    
    try {
      // Run linting first
      if (!(await this.runLinting())) {
        allPassed = false;
      }
      
      // Run unit tests
      if (this.config.runUnit && !(await this.runUnitTests())) {
        allPassed = false;
      }
      
      // Run integration tests
      if (this.config.runIntegration && !(await this.runIntegrationTests())) {
        allPassed = false;
      }
      
      // Run E2E tests
      if (!(await this.runE2ETests())) {
        allPassed = false;
      }
      
      // Run performance tests
      if (!(await this.runPerformanceTests())) {
        allPassed = false;
      }
      
      // Run compatibility tests
      if (!(await this.runCompatibilityTests())) {
        allPassed = false;
      }
      
      // Run error handling tests
      if (!(await this.runErrorHandlingTests())) {
        allPassed = false;
      }
      
      // Run coverage tests
      if (!(await this.runCoverageTests())) {
        allPassed = false;
      }
      
    } catch (error) {
      this.log(`Test suite failed with error: ${error.message}`, 'error');
      allPassed = false;
    }
    
    // Generate report
    const report = await this.generateReport();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (allPassed) {
      this.log(`All tests completed successfully in ${duration}s! 🎉`, 'success');
    } else {
      this.log(`Some tests failed. Check the report for details. Duration: ${duration}s`, 'error');
    }
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;