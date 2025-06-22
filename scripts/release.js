#!/usr/bin/env node

/**
 * Release script for claude-test
 * Handles version bumping, tagging, and publishing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const VALID_RELEASES = ['patch', 'minor', 'major', 'prerelease'];

function execute(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
  } catch (error) {
    console.error(chalk.red(`Failed to execute: ${command}`));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

function getCurrentVersion() {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

function validateGitStatus() {
  console.log(chalk.blue('🔍 Checking git status...'));
  
  const status = execute('git status --porcelain', { silent: true });
  if (status.trim()) {
    console.error(chalk.red('❌ Working directory is not clean. Please commit or stash changes.'));
    process.exit(1);
  }
  
  const branch = execute('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
  if (branch !== 'master') {
    console.error(chalk.red(`❌ Not on master branch. Current branch: ${branch}`));
    console.log(chalk.yellow('Please switch to master branch before releasing.'));
    process.exit(1);
  }
  
  console.log(chalk.green('✅ Git status is clean and on master branch'));
}

function runTests() {
  console.log(chalk.blue('🧪 Running test suite...'));
  execute('npm run ci');
  console.log(chalk.green('✅ All tests passed'));
}

function updateVersion(releaseType) {
  console.log(chalk.blue(`📦 Bumping ${releaseType} version...`));
  
  const currentVersion = getCurrentVersion();
  console.log(chalk.gray(`Current version: ${currentVersion}`));
  
  const newVersion = execute(`npm version ${releaseType} --no-git-tag-version`, { silent: true }).trim();
  const cleanVersion = newVersion.replace('v', '');
  
  console.log(chalk.green(`✅ Version bumped to: ${cleanVersion}`));
  return cleanVersion;
}

function createGitTag(version) {
  console.log(chalk.blue('🏷️  Creating git tag...'));
  
  const tagName = `v${version}`;
  
  // Commit version change
  execute('git add package.json package-lock.json');
  execute(`git commit -m "chore: bump version to ${version}"`);
  
  // Create and push tag
  execute(`git tag ${tagName}`);
  execute('git push origin master');
  execute(`git push origin ${tagName}`);
  
  console.log(chalk.green(`✅ Created and pushed tag: ${tagName}`));
  return tagName;
}

function publishToNpm() {
  console.log(chalk.blue('📤 Publishing to NPM...'));
  
  // Dry run first
  execute('npm publish --dry-run');
  console.log(chalk.green('✅ Dry run successful'));
  
  // Actual publish
  execute('npm publish');
  console.log(chalk.green('✅ Successfully published to NPM'));
}

function verifyRelease(version) {
  console.log(chalk.blue('🔍 Verifying release...'));
  
  // Wait a moment for NPM to propagate
  console.log(chalk.gray('Waiting for NPM to propagate...'));
  setTimeout(() => {
    try {
      const npmVersion = execute(`npm view claude-test version`, { silent: true }).trim();
      if (npmVersion === version) {
        console.log(chalk.green(`✅ Release verified: claude-test@${version} is available on NPM`));
      } else {
        console.log(chalk.yellow(`⚠️  NPM version (${npmVersion}) doesn't match released version (${version})`));
        console.log(chalk.gray('This may be due to NPM propagation delay.'));
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not verify NPM release (this is normal for new packages)'));
    }
  }, 5000);
}

function printInstructions(version) {
  console.log(chalk.green('\n🎉 Release completed successfully!'));
  console.log(chalk.blue('\n📋 Post-release checklist:'));
  console.log(chalk.gray('1. Check GitHub Actions for release workflow completion'));
  console.log(chalk.gray('2. Verify GitHub release was created automatically'));
  console.log(chalk.gray('3. Test installation from NPM:'));
  console.log(chalk.cyan(`   npm install -g claude-test@${version}`));
  console.log(chalk.cyan('   claude-test --version'));
  console.log(chalk.gray('4. Update any dependent projects'));
  console.log(chalk.gray('5. Announce the release if it contains significant changes'));
}

function main() {
  const args = process.argv.slice(2);
  const releaseType = args[0];
  
  if (!releaseType || !VALID_RELEASES.includes(releaseType)) {
    console.error(chalk.red('❌ Invalid release type'));
    console.log(chalk.yellow('Usage: npm run release <type>'));
    console.log(chalk.yellow(`Valid types: ${VALID_RELEASES.join(', ')}`));
    console.log(chalk.gray('\nExamples:'));
    console.log(chalk.cyan('  npm run release patch   # Bug fixes'));
    console.log(chalk.cyan('  npm run release minor   # New features'));
    console.log(chalk.cyan('  npm run release major   # Breaking changes'));
    process.exit(1);
  }
  
  console.log(chalk.blue(`🚀 Starting ${releaseType} release process...\n`));
  
  try {
    validateGitStatus();
    runTests();
    const newVersion = updateVersion(releaseType);
    const tagName = createGitTag(newVersion);
    
    console.log(chalk.blue('\n📦 NPM Publishing:'));
    console.log(chalk.yellow('Note: NPM publishing will be handled by GitHub Actions'));
    console.log(chalk.gray(`Tag ${tagName} will trigger the release workflow`));
    
    verifyRelease(newVersion);
    printInstructions(newVersion);
    
  } catch (error) {
    console.error(chalk.red('\n❌ Release failed:'), error.message);
    console.log(chalk.yellow('\nPlease fix the issues and try again.'));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  execute,
  getCurrentVersion,
  validateGitStatus,
  runTests,
  updateVersion,
  createGitTag
};