#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * 
 * Monitors CLI tool performance and generates performance reports
 */

const { performance } = require('perf_hooks');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.results = [];
    this.config = {
      iterations: process.env.PERF_ITERATIONS || 10,
      timeout: process.env.PERF_TIMEOUT || 30000,
      warmup: process.env.PERF_WARMUP || 3,
      verbose: process.env.VERBOSE === 'true'
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
  
  startTimer(name) {
    this.metrics[name] = {
      start: performance.now(),
      memory: process.memoryUsage()
    };
  }
  
  endTimer(name) {
    if (!this.metrics[name]) {
      throw new Error(`Timer '${name}' was not started`);
    }
    
    const metric = this.metrics[name];
    const duration = performance.now() - metric.start;
    const finalMemory = process.memoryUsage();
    
    const result = {
      name,
      duration,
      memoryBefore: metric.memory,
      memoryAfter: finalMemory,
      memoryDelta: {
        rss: finalMemory.rss - metric.memory.rss,
        heapTotal: finalMemory.heapTotal - metric.memory.heapTotal,
        heapUsed: finalMemory.heapUsed - metric.memory.heapUsed,
        external: finalMemory.external - metric.memory.external
      }
    };
    
    this.results.push(result);
    
    if (this.config.verbose) {
      this.log(`${name}: ${duration.toFixed(2)}ms, Memory: ${(result.memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
    
    return result;
  }
  
  async benchmarkCommand(command, options = {}) {
    const iterations = options.iterations || this.config.iterations;
    const warmupRuns = options.warmup || this.config.warmup;
    const results = [];
    
    this.log(`Benchmarking: ${command}`);
    
    // Warmup runs
    for (let i = 0; i < warmupRuns; i++) {
      try {
        execSync(command, {
          stdio: 'pipe',
          timeout: this.config.timeout,
          ...options.execOptions
        });
      } catch (error) {
        // Warmup failures are not critical
        if (this.config.verbose) {
          this.log(`Warmup run ${i + 1} failed: ${error.message}`, 'warning');
        }
      }
    }
    
    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      const runName = `${command}_run_${i + 1}`;
      
      this.startTimer(runName);
      
      try {
        const output = execSync(command, {
          stdio: 'pipe',
          timeout: this.config.timeout,
          encoding: 'utf8',
          ...options.execOptions
        });
        
        const result = this.endTimer(runName);
        result.success = true;
        result.output = output;
        results.push(result);
        
      } catch (error) {
        const result = this.endTimer(runName);
        result.success = false;
        result.error = error.message;
        result.exitCode = error.status;
        results.push(result);
      }
    }
    
    return this.analyzeResults(command, results);
  }
  
  analyzeResults(command, results) {
    const successfulRuns = results.filter(r => r.success);
    const failedRuns = results.filter(r => !r.success);
    
    if (successfulRuns.length === 0) {
      return {
        command,
        success: false,
        error: 'All runs failed',
        totalRuns: results.length,
        successfulRuns: 0,
        failedRuns: failedRuns.length
      };
    }
    
    const durations = successfulRuns.map(r => r.duration);
    const memoryDeltas = successfulRuns.map(r => r.memoryDelta.heapUsed);
    
    const analysis = {
      command,
      success: true,
      totalRuns: results.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      performance: {
        duration: {
          min: Math.min(...durations),
          max: Math.max(...durations),
          avg: durations.reduce((a, b) => a + b, 0) / durations.length,
          median: this.calculateMedian(durations),
          p95: this.calculatePercentile(durations, 95),
          p99: this.calculatePercentile(durations, 99)
        },
        memory: {
          min: Math.min(...memoryDeltas),
          max: Math.max(...memoryDeltas),
          avg: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
          median: this.calculateMedian(memoryDeltas)
        }
      },
      results: successfulRuns
    };
    
    this.log(`✅ ${command}: ${analysis.performance.duration.avg.toFixed(2)}ms avg (${successfulRuns.length}/${results.length} successful)`);
    
    return analysis;
  }
  
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }
  
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  async generateReport(results, outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem()
      },
      configuration: this.config,
      summary: {
        totalCommands: results.length,
        successfulCommands: results.filter(r => r.success).length,
        failedCommands: results.filter(r => !r.success).length,
        averageDuration: results
          .filter(r => r.success)
          .reduce((sum, r) => sum + r.performance.duration.avg, 0) / 
          results.filter(r => r.success).length || 0
      },
      results
    };
    
    // Write detailed JSON report
    const jsonPath = path.join(outputPath, `performance-report-${Date.now()}.json`);
    await fs.writeJSON(jsonPath, report, { spaces: 2 });
    
    // Write human-readable summary
    const summaryPath = path.join(outputPath, `performance-summary-${Date.now()}.md`);
    await this.generateMarkdownSummary(report, summaryPath);
    
    this.log(`Reports generated: ${jsonPath}, ${summaryPath}`, 'success');
    
    return report;
  }
  
  async generateMarkdownSummary(report, outputPath) {
    const lines = [
      '# Performance Test Report',
      '',
      `**Generated:** ${report.timestamp}`,
      `**Platform:** ${report.environment.platform} ${report.environment.arch}`,
      `**Node.js:** ${report.environment.nodeVersion}`,
      `**CPUs:** ${report.environment.cpuCount}`,
      `**Memory:** ${(report.environment.totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB total, ${(report.environment.freeMemory / 1024 / 1024 / 1024).toFixed(2)}GB free`,
      '',
      '## Summary',
      '',
      `- Total commands tested: ${report.summary.totalCommands}`,
      `- Successful: ${report.summary.successfulCommands}`,
      `- Failed: ${report.summary.failedCommands}`,
      `- Average duration: ${report.summary.averageDuration.toFixed(2)}ms`,
      '',
      '## Command Performance',
      ''
    ];
    
    // Add table header
    lines.push('| Command | Success Rate | Avg Duration | Min | Max | P95 | Memory Avg |');
    lines.push('|---------|--------------|--------------|-----|-----|-----|------------|');
    
    // Add results
    for (const result of report.results.filter(r => r.success)) {
      const successRate = `${result.successfulRuns}/${result.totalRuns}`;
      const avgDuration = result.performance.duration.avg.toFixed(2);
      const minDuration = result.performance.duration.min.toFixed(2);
      const maxDuration = result.performance.duration.max.toFixed(2);
      const p95Duration = result.performance.duration.p95.toFixed(2);
      const avgMemory = (result.performance.memory.avg / 1024 / 1024).toFixed(2);
      
      lines.push(`| \`${result.command}\` | ${successRate} | ${avgDuration}ms | ${minDuration}ms | ${maxDuration}ms | ${p95Duration}ms | ${avgMemory}MB |`);
    }
    
    // Add failed commands section
    const failedCommands = report.results.filter(r => !r.success);
    if (failedCommands.length > 0) {
      lines.push('', '## Failed Commands', '');
      for (const failed of failedCommands) {
        lines.push(`- \`${failed.command}\`: ${failed.error}`);
      }
    }
    
    lines.push('', '---', `*Generated by claude-test performance monitor*`);
    
    await fs.writeFile(outputPath, lines.join('\n'));
  }
  
  async runFullBenchmark() {
    this.log('Starting comprehensive performance benchmark...', 'info');
    
    const cliPath = path.join(__dirname, '../bin/claude-test.js');
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-perf-'));
    
    const commands = [
      { cmd: `node ${cliPath} --version`, name: 'version' },
      { cmd: `node ${cliPath} --help`, name: 'help' },
      { cmd: `node ${cliPath} check`, name: 'check', cwd: tempDir },
      { cmd: `node ${cliPath} init`, name: 'init', cwd: tempDir },
    ];
    
    const results = [];
    
    try {
      for (const { cmd, name, cwd } of commands) {
        this.log(`Testing ${name}...`);
        
        const result = await this.benchmarkCommand(cmd, {
          execOptions: { cwd: cwd || process.cwd() },
          iterations: this.config.iterations
        });
        
        results.push(result);
      }
      
      // Generate reports
      const reportsDir = path.join(process.cwd(), 'performance-reports');
      await fs.ensureDir(reportsDir);
      
      const report = await this.generateReport(results, reportsDir);
      
      this.log('Performance benchmark completed!', 'success');
      
      return report;
      
    } finally {
      await fs.remove(tempDir);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  
  monitor.runFullBenchmark()
    .then(report => {
      console.log('\n' + chalk.bold('PERFORMANCE SUMMARY'));
      console.log('━'.repeat(50));
      console.log(`Commands tested: ${report.summary.totalCommands}`);
      console.log(`Success rate: ${report.summary.successfulCommands}/${report.summary.totalCommands}`);
      console.log(`Average duration: ${report.summary.averageDuration.toFixed(2)}ms`);
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Performance benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceMonitor;