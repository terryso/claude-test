# Validate YAML Test Cases

Validates YAML-based Playwright test cases for syntax and completeness, ensuring all referenced step libraries exist and environment variables are properly configured.

## Parameters

- `file` (required): Path to the test case file to validate
- `env` (optional): Environment name (dev/test/prod), defaults to dev

## Validation Process

You need to help me validate a YAML format Playwright test case. This test case may reference other YAML files defined in the step libraries.

Validation workflow:
1. Load the corresponding .env file based on env parameter (.env.dev, .env.test, .env.prod)
2. Parse the specified test case file:
   - Check YAML syntax validity
   - Verify tags field exists and is an array
   - Verify steps field exists and is an array
3. For each test case:
   - Validate all "include" references point to existing step library files in steps/ directory
   - Check that all referenced step libraries have valid YAML syntax
   - Verify all environment variables used in {{ENV_VAR}} format are defined in the .env file
   - Ensure all required environment variables are present (BASE_URL, TEST_USERNAME, TEST_PASSWORD, etc.)
   - Validate GENERATE_REPORT and REPORT_FORMAT configurations if present
4. Report validation results and any issues found
5. Provide suggestions for fixing any problems
6. If validation passes, display file structure summary, tag information, and environment variable usage

## YAML Format Specifications

**Test Case Structure**:
- **tags**: Array of strings for categorizing and filtering tests
- **steps**: Array of test steps using natural language descriptions
- **include**: References to step library files for reusable components

**Step Library Structure**:
- **steps**: Array containing reusable step sequences
- **description**: Optional description of the step library purpose

**Environment Variables**:
- **Syntax**: Use `{{ENV_VAR}}` format for variable substitution
- **Sources**: Variables loaded from `.env.{environment}` files
- **Required Variables**: BASE_URL, TEST_USERNAME, TEST_PASSWORD, etc.

**Include References**:
- **Format**: Use `include: step-library-name` to reference step libraries
- **Resolution**: Files resolved from `steps/` directory
- **Extension**: Step library files should have `.yml` extension

## Validation Checklist

### ✅ Successful Validation Indicators
- YAML syntax is valid and parseable
- All required fields (tags, steps) are present
- All include references resolve to existing step library files
- All environment variables are defined in .env files
- Step library files have valid YAML structure
- No circular dependencies in includes

### ❌ Common Validation Errors
- Invalid YAML syntax or structure
- Missing required fields (tags or steps arrays)
- Referenced step libraries don't exist
- Undefined environment variables in {{}} syntax
- Circular include dependencies
- Invalid file paths or naming

### ⚠️ Validation Warnings
- Missing descriptions for test cases
- Unused environment variables
- Step libraries not referenced by any tests
- Very long test step descriptions
- Missing tags for categorization

## Best Practices

1. **Use descriptive test names**: Choose clear, meaningful filenames
2. **Add comprehensive tags**: Include relevant tags for filtering and organization
3. **Modularize with step libraries**: Create reusable step sequences
4. **Document environment variables**: Ensure all variables are documented
5. **Regular validation**: Validate tests before execution and in CI/CD

Please load environment configuration based on parameters, parse YAML structure, validate includes and environment variables, then provide a comprehensive validation report with specific recommendations for any issues found.

ARGUMENTS: {file} {env}