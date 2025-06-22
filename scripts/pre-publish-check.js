#!/usr/bin/env node

/**
 * Pre-publish validation script
 * Ensures package is ready for publishing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

function execute(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function checkFiles() {
  console.log(chalk.blue('📂 Checking required files...'));
  
  const requiredFiles = [
    'package.json',
    'README.md',
    'LICENSE',
    'bin/claude-test.js',
    'lib/commands/init.js',
    'lib/commands/update.js',
    'lib/commands/check.js',
    'lib/utils/file-manager.js',
    'lib/utils/version-manager.js'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, '..', file))) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
  }
  
  console.log(chalk.green('✅ All required files present'));
}

function checkPackageJson() {
  console.log(chalk.blue('📦 Validating package.json...'));
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'repository', 'license'];
  const missingFields = requiredFields.filter(field => !pkg[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing package.json fields: ${missingFields.join(', ')}`);
  }
  
  // Check bin field
  if (!pkg.bin || !pkg.bin['claude-test']) {
    throw new Error('Missing or invalid bin field in package.json');
  }
  
  // Check files field
  if (!pkg.files || !Array.isArray(pkg.files)) {
    throw new Error('Missing or invalid files field in package.json');
  }
  
  console.log(chalk.green('✅ package.json is valid'));
  console.log(chalk.gray(`  Name: ${pkg.name}`));
  console.log(chalk.gray(`  Version: ${pkg.version}`));
  console.log(chalk.gray(`  License: ${pkg.license}`));
}

function checkBinExecutable() {
  console.log(chalk.blue('🔧 Checking CLI executable...'));
  
  const binPath = path.join(__dirname, '..', 'bin', 'claude-test.js');
  
  if (!fs.existsSync(binPath)) {
    throw new Error('CLI executable not found: bin/claude-test.js');
  }
  
  const content = fs.readFileSync(binPath, 'utf8');
  
  if (!content.startsWith('#!/usr/bin/env node')) {
    throw new Error('CLI executable missing shebang: #!/usr/bin/env node');
  }
  
  console.log(chalk.green('✅ CLI executable is valid'));
}

function runLinting() {
  console.log(chalk.blue('🔍 Running linting...'));
  execute('npm run lint');
  console.log(chalk.green('✅ Linting passed'));
}

function runTests() {
  console.log(chalk.blue('🧪 Running tests...'));
  execute('npm test');
  console.log(chalk.green('✅ All tests passed'));
}

function checkCoverage() {
  console.log(chalk.blue('📊 Checking test coverage...'));
  execute('npm run test:coverage');
  console.log(chalk.green('✅ Coverage requirements met'));
}

function testPackaging() {
  console.log(chalk.blue('📦 Testing package structure...'));
  
  try {
    // Check files list in package.json
    const packagePath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (!pkg.files || !Array.isArray(pkg.files)) {
      throw new Error('Missing or invalid files field in package.json');
    }
    
    // Verify that files specified in package.json actually exist
    for (const filePattern of pkg.files) {
      const filePath = path.join(__dirname, '..', filePattern);
      if (!fs.existsSync(filePath)) {
        throw new Error(`File specified in package.json does not exist: ${filePattern}`);
      }
    }
    
    console.log(chalk.green('✅ Package structure is valid'));
    console.log(chalk.gray(`  Files included: ${pkg.files.join(', ')}`));
    
  } catch (error) {
    throw new Error(`Package structure test failed: ${error.message}`);
  }
}

function testCLIInstallation() {
  console.log(chalk.blue('🔧 Testing CLI installation...'));
  
  try {
    // Create actual package
    execute('npm pack', { silent: true });
    
    // Get package filename
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const packageFile = `${pkg.name}-${pkg.version}.tgz`;
    
    // Test global installation
    execute(`npm install -g ./${packageFile}`, { silent: true });
    
    // Test CLI commands
    const versionOutput = execute('claude-test --version', { silent: true });
    if (!versionOutput.includes(pkg.version)) {
      throw new Error('CLI version command failed or returned wrong version');
    }
    
    const helpOutput = execute('claude-test --help', { silent: true });
    if (!helpOutput.includes('init') || !helpOutput.includes('update') || !helpOutput.includes('check')) {
      throw new Error('CLI help command missing expected commands');
    }
    
    // Clean up
    execute(`npm uninstall -g ${pkg.name}`, { silent: true });
    fs.unlinkSync(packageFile);
    
    console.log(chalk.green('✅ CLI installation test passed'));
    
  } catch (error) {
    throw new Error(`CLI installation test failed: ${error.message}`);
  }
}

function checkDependencies() {
  console.log(chalk.blue('🔒 Checking dependencies...'));
  
  try {
    execute('npm audit --audit-level moderate', { silent: true });
    console.log(chalk.green('✅ No moderate or high severity vulnerabilities found'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  Security audit found issues. Review before publishing.'));
    // Don't fail the build for audit issues, just warn
  }
}

function main() {
  console.log(chalk.blue('🚀 Running pre-publish validation...\n'));
  
  const checks = [
    { name: 'File Check', fn: checkFiles },
    { name: 'Package.json Validation', fn: checkPackageJson },
    { name: 'Binary Executable Check', fn: checkBinExecutable },
    { name: 'Linting', fn: runLinting },
    { name: 'Tests', fn: runTests },
    { name: 'Coverage', fn: checkCoverage },
    { name: 'Package Structure', fn: testPackaging },
    { name: 'CLI Installation', fn: testCLIInstallation },
    { name: 'Dependencies', fn: checkDependencies }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    try {
      check.fn();
      passed++;
    } catch (error) {
      console.error(chalk.red(`❌ ${check.name} failed:`));
      console.error(chalk.red(`   ${error.message}`));
      failed++;
    }
    console.log('');
  }
  
  console.log(chalk.blue('📋 Pre-publish validation summary:'));
  console.log(chalk.green(`✅ Passed: ${passed}`));
  if (failed > 0) {
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.red('\n🚫 Package is not ready for publishing!'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n🎉 Package is ready for publishing!'));
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkFiles,
  checkPackageJson,
  checkBinExecutable,
  runLinting,
  runTests,
  checkCoverage,
  testPackaging,
  testCLIInstallation,
  checkDependencies
};