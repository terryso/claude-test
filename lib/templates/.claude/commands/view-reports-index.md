# View Test Reports Index

View comprehensive test report index page for all environments with environment switching and report browsing capabilities.

## Parameters

No parameters required - automatically scans all environment reports.

## Features

- 📊 **Automatic Scanning**: Auto-discovers all test reports across environments
- 🎯 **Environment Switching**: Supports dev/test/prod environment tab navigation
- 📈 **Statistics**: Displays report statistics for each environment
- 🔍 **Report Details**: Shows report type, size, generation time, and other metadata
- 📱 **Responsive Design**: Desktop and mobile-friendly interface

## Execution Process

You need to help me launch a comprehensive test report index viewer that organizes and displays all test reports across different environments.

**IMPORTANT: Use the automated report indexing and server startup process**

Execution workflow:
1. **Refresh Report Index**: Scan all environment directories and generate updated report listings
2. **Start Local Server**: Launch HTTP server to host the report index page
3. **Open Browser**: Automatically open the report index page in the default browser

### Automated Index Generation Command:
```bash
node .claude/scripts/scan-reports.js
```

### Report Server Startup Command:
```bash
node .claude/scripts/start-report-server.js
```

## Report Directory Structure

The command scans the following directories:
- `reports/dev/` - Development environment reports
- `reports/test/` - Test environment reports  
- `reports/prod/` - Production environment reports

## Generated Files

1. **Index Data**: `reports/index.json` - Contains metadata for all discovered reports
2. **Server Files**: Temporary server files for hosting the index page

## Report Types Supported

- **Suite Reports**: Multi-test case suite execution reports
- **Test Reports**: Individual test case detailed execution reports
- **Batch Reports**: Batch execution reports covering multiple tests

## Index Page Features

### Environment Navigation
- **Environment Tabs**: Click to switch between dev/test/prod environment reports
- **Report Cards**: Interactive cards showing report summary information
- **Quick Access**: Direct links to individual report files

### Report Information Display
- **Report Name**: Test or suite name with timestamp
- **Execution Status**: Pass/fail status with visual indicators
- **Duration**: Test execution time
- **File Size**: Report file size information
- **Generation Time**: When the report was created
- **Tags**: Associated test tags for filtering

### Interactive Features
- **Refresh Button**: Manual refresh of report listings
- **Search/Filter**: Filter reports by name, status, or tags
- **Statistics Panel**: Environment-specific report count summaries
- **Sort Options**: Sort by date, name, status, or duration

## Usage Instructions

When you execute this command, the following happens:

1. **Environment Scanning**: 
   - Scans `reports/dev/`, `reports/test/`, `reports/prod/` directories
   - Discovers all HTML report files and extracts metadata
   - Categorizes reports by type (suite, test, batch)

2. **Index Generation**:
   - Creates `reports/index.json` with comprehensive report metadata
   - Includes file paths, timestamps, sizes, and embedded report data
   - Organizes data by environment for efficient loading

3. **Server Launch**:
   - Starts local HTTP server on port 8080
   - Serves static report files and index page
   - Enables cross-origin resource sharing for report access

4. **Browser Opening**:
   - Automatically opens `http://localhost:8080` in default browser
   - Displays interactive report index interface
   - Provides immediate access to all available reports

## Server Management

### Starting the Server
The report server automatically starts when this command is executed. The server:
- Binds to `localhost:8080` by default
- Serves all report files and assets
- Provides RESTful API for report metadata
- Includes automatic refresh capabilities

### Stopping the Server
To stop the report server:
- Use `Ctrl+C` in the terminal where the server is running
- Or execute: `pkill -f "start-report-server.js"`

### Server Features
- **Static File Serving**: Serves HTML reports and assets
- **CORS Enabled**: Allows cross-origin requests for report data
- **Error Handling**: Graceful handling of missing files or corrupt reports
- **Logging**: Console logging of server activity and access

## Troubleshooting

### Common Issues

**No Reports Found**:
- Ensure test reports have been generated in environment directories
- Check that GENERATE_REPORT=true was set during test execution
- Verify report directories exist: `reports/dev/`, `reports/test/`, `reports/prod/`

**Server Won't Start**:
- Check if port 8080 is already in use: `lsof -i :8080`
- Kill existing processes using the port if needed
- Try alternative port if specified in configuration

**Reports Not Loading**:
- Verify report files are valid HTML with embedded JSON data
- Check browser console for JavaScript errors
- Ensure report files have proper read permissions

**Index Data Corruption**:
- Delete `reports/index.json` and re-run the command
- Check for invalid characters in report filenames
- Verify all report files have proper structure

## Performance Considerations

- **Large Report Sets**: Index generation time increases with number of reports
- **File Size Impact**: Large report files affect server startup time
- **Browser Memory**: Many reports may impact browser performance
- **Network Access**: Server requires localhost network access

Launch the comprehensive test report index viewer to efficiently browse, organize, and access all test execution reports across different environments.

ARGUMENTS: (no arguments required)