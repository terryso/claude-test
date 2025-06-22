# Release Guide

This document outlines the release process for claude-test.

## Release Types

Following [Semantic Versioning (SemVer)](https://semver.org/):

- **PATCH** (1.0.1): Bug fixes, documentation updates, minor improvements
- **MINOR** (1.1.0): New features, backward compatible changes
- **MAJOR** (2.0.0): Breaking changes, API changes

## Prerequisites

Before creating a release:

1. **Clean working directory**: No uncommitted changes
2. **Master branch**: Must be on the master branch
3. **All tests passing**: Full test suite must pass
4. **Documentation updated**: README.md and command docs current
5. **CHANGELOG updated**: Document all changes since last release

## Release Process

### 1. Pre-release Validation

Run the pre-publish checks:

```bash
npm run prepublish-check
```

This validates:
- ✅ All required files present
- ✅ package.json validity
- ✅ CLI executable functionality
- ✅ Linting passes
- ✅ All tests pass
- ✅ Coverage requirements met
- ✅ Package structure correct
- ✅ CLI installation works
- ✅ No high-severity vulnerabilities

### 2. Create Release

Choose the appropriate release type:

```bash
# Bug fixes and minor improvements
npm run release:patch

# New features (backward compatible)
npm run release:minor

# Breaking changes
npm run release:major
```

### 3. Automated Process

The release script automatically:

1. **Validates environment**: Checks git status and branch
2. **Runs full test suite**: Ensures quality
3. **Bumps version**: Updates package.json and package-lock.json
4. **Creates git commit**: Commits version changes
5. **Creates git tag**: Tags the release (format: v1.2.3)
6. **Pushes to GitHub**: Pushes commits and tags

### 4. GitHub Actions CI/CD

Once the tag is pushed, GitHub Actions automatically:

1. **Runs CI pipeline**:
   - Tests on Node.js 16.x, 18.x, 20.x
   - Tests on Ubuntu, macOS
   - Runs security audit
   - Validates CLI functionality

2. **Publishes to NPM**:
   - Runs pre-publish validation
   - Publishes package to NPM registry
   - Uses NPM_TOKEN secret for authentication

3. **Creates GitHub Release**:
   - Generates release notes
   - Attaches package assets
   - Marks release as published

## Manual Release Process

If automatic release fails, you can publish manually:

### 1. Ensure prerequisites

```bash
# Check git status
git status

# Run tests
npm run ci

# Run pre-publish checks
npm run prepublish-check
```

### 2. Version and tag

```bash
# Bump version (patch/minor/major)
npm version patch

# Push with tags
git push origin master --tags
```

### 3. Publish to NPM

```bash
# Login to NPM (if not already)
npm login

# Publish package
npm publish
```

### 4. Create GitHub Release

- Go to [GitHub Releases](https://github.com/anthropics/claude-test/releases)
- Click "Draft a new release"
- Select the tag you just created
- Generate release notes
- Publish release

## Release Verification

After release, verify everything works:

### 1. NPM Installation

```bash
# Install from NPM
npm install -g claude-test@latest

# Verify version
claude-test --version

# Test basic functionality
claude-test --help
claude-test init --help
```

### 2. GitHub Release

- Check that GitHub release was created
- Verify release notes are accurate
- Confirm assets are attached

### 3. CI/CD Pipeline

- Review GitHub Actions workflow runs
- Ensure all jobs passed
- Check for any warnings or issues

## Troubleshooting

### Common Issues

**Git not clean**:
```bash
git status
git add .
git commit -m "Prepare for release"
```

**Tests failing**:
```bash
npm test
npm run lint:fix
```

**NPM publish fails**:
```bash
npm login
npm whoami
npm run prepublish-check
```

**Tag already exists**:
```bash
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3
```

### Recovery from Failed Release

If a release fails partway through:

1. **Check what was completed**:
   ```bash
   git log --oneline -5
   git tag -l | grep v
   npm view claude-test version
   ```

2. **Reset if needed**:
   ```bash
   # Reset version in package.json if needed
   git checkout HEAD~1 package.json package-lock.json
   
   # Delete local tag if created
   git tag -d v1.2.3
   
   # Delete remote tag if pushed
   git push origin :refs/tags/v1.2.3
   ```

3. **Start over**: Run the release process again

## NPM Token Management

The NPM_TOKEN secret must be configured in GitHub repository settings:

1. **Generate NPM token**:
   - Go to npmjs.com → Account → Access Tokens
   - Create "Automation" token
   - Copy the token

2. **Add to GitHub secrets**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add new secret: `NPM_TOKEN`
   - Paste the token value

3. **Token scope**: Token must have "Automation" permissions for publishing

## Release Checklist

Before releasing:

- [ ] All features implemented and tested
- [ ] Documentation updated (README.md, command docs)
- [ ] CHANGELOG.md updated with release notes
- [ ] Version number follows SemVer
- [ ] All tests passing locally
- [ ] No security vulnerabilities
- [ ] Working directory clean
- [ ] On main branch with latest changes

After releasing:

- [ ] NPM package published successfully
- [ ] GitHub release created
- [ ] CI/CD pipeline completed
- [ ] Installation from NPM works
- [ ] Version verification passes
- [ ] Dependent projects notified (if applicable)

## Emergency Hotfix

For critical bugs requiring immediate release:

1. **Create hotfix branch**:
   ```bash
   git checkout -b hotfix/critical-fix
   ```

2. **Make minimal fix**: Only fix the critical issue

3. **Test thoroughly**:
   ```bash
   npm run ci
   npm run prepublish-check
   ```

4. **Merge to master**:
   ```bash
   git checkout master
   git merge hotfix/critical-fix
   ```

5. **Release patch version**:
   ```bash
   npm run release:patch
   ```

## Contact

For release issues or questions:
- GitHub Issues: [Report a problem](https://github.com/anthropics/claude-test/issues)
- GitHub Discussions: [Ask questions](https://github.com/anthropics/claude-test/discussions)