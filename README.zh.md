# claude-test

[![npm version](https://badge.fury.io/js/claude-test.svg)](https://badge.fury.io/js/claude-test)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-test.svg)](https://www.npmjs.com/package/claude-test)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-84.95%25-brightgreen.svg)](https://github.com/terryso/claude-test)
[![GitHub Issues](https://img.shields.io/github/issues/terryso/claude-test.svg)](https://github.com/terryso/claude-test/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

🎯 [English](README.md) | **中文**

专为Claude Code设计的基于YAML的Playwright MCP测试框架CLI工具。这是**官方CLI包**，允许您在任何项目中轻松初始化、管理和更新复杂的测试框架。

> **🚀 最新特性**: 革命性的会话持久化、多环境支持、智能HTML报告，代码覆盖率84.95%。

## 安装

```bash
npm install -g claude-test
```

## 快速开始

### 1. 全局安装
```bash
npm install -g claude-test
```

### 2. 在项目中初始化
```bash
cd your-project
claude-test init
```

### 3. 创建第一个测试
创建测试文件 `test-cases/login.yml`:
```yaml
tags: [smoke, login]
steps:
  - "Navigate to {{BASE_URL}}"
  - "Fill username field with {{TEST_USERNAME}}"
  - "Fill password field with {{TEST_PASSWORD}}"
  - "Click login button"
  - "Verify dashboard is displayed"
```

### 4. 设置环境变量
创建 `.env.dev`:
```bash
BASE_URL=https://example.com
TEST_USERNAME=testuser
TEST_PASSWORD=testpass123
GENERATE_REPORT=true
REPORT_STYLE=detailed
```

### 5. 运行测试
```bash
/run-yaml-test file:login.yml env:dev
```

### 6. 查看结果
```bash
/view-reports-index
```

## 命令

### `claude-test init`

在当前项目目录中初始化测试框架。

```bash
claude-test init [选项]
```

**选项:**
- `-f, --force` - 即使框架已存在也强制初始化
- `--verbose` - 初始化过程中显示详细输出

**示例:**
```bash
# 基础初始化
claude-test init

# 强制重新初始化并显示详细输出
claude-test init --force --verbose
```

### `claude-test update`

将框架更新到最新版本。

```bash
claude-test update [选项]
```

**选项:**
- `--backup` - 更新前创建备份
- `--dry-run` - 显示将要更新的内容但不执行更改
- `--verbose` - 显示详细输出

**示例:**
```bash
# 带备份的更新
claude-test update --backup

# 预览更改但不应用
claude-test update --dry-run

# 详细更新过程
claude-test update --verbose
```

### `claude-test check`

检查框架版本和状态。

```bash
claude-test check [选项]
```

**选项:**
- `--remote` - 检查远程更新（未来功能）
- `--fix` - 尝试自动修复完整性问题
- `--verbose` - 显示详细输出

**示例:**
```bash
# 基础状态检查
claude-test check

# 检查并修复问题
claude-test check --fix

# 详细状态报告
claude-test check --verbose
```

## 框架特性

初始化后，您的项目将拥有完整的测试框架，包含：

- 🌍 **多环境支持**: 支持dev/test/prod环境
- 📚 **可复用步骤库**: 模块化和可复用的测试组件
- 🗣️ **自然语言**: 用自然语言描述编写测试
- 🔧 **环境变量**: 从.env文件自动加载配置
- 📊 **智能报告**: 嵌入数据的精美HTML测试报告
- ⚡ **会话持久化**: 通过持久化浏览器会话加快测试执行
- 🚀 **CLI管理**: 简易的安装、更新和完整性检查

## 项目结构

运行 `claude-test init` 后，您的项目将包含：

```
.claude/
├── commands/                     # Claude Code命令
│   ├── run-yaml-test.md         # 执行单个测试
│   ├── run-test-suite.md        # 执行测试套件
│   ├── validate-yaml-test.md    # 验证测试语法
│   ├── validate-test-suite.md   # 验证套件语法
│   └── view-reports-index.md    # 查看测试报告
└── scripts/                     # 框架自动化脚本
    ├── yaml-test-processor.js   # YAML测试处理引擎
    ├── create-report-data.js    # 报告数据创建（步骤1）
    ├── gen-report.js           # HTML报告生成（步骤2）
    ├── scan-reports.js         # 报告索引和组织
    ├── start-report-server.js  # 报告本地HTTP服务器
    └── suite-report-generator.js # 测试套件报告生成器
```

## 版本管理

CLI自动管理框架版本：

- **安装跟踪**: 记录框架安装的时间和方式
- **版本兼容性**: 确保CLI和框架版本兼容
- **自动更新**: 更新框架文件同时保留自定义设置
- **完整性检查**: 验证所有必需文件存在且有效
- **备份支持**: 更新前可选择创建备份

## 系统要求

- **Node.js**: >= 16.0.0
- **Claude Code**: 带Playwright MCP集成
- **NPM**: 用于全局安装

## 实际示例

### 示例1: 电商测试套件

**测试套件** (`test-suites/e-commerce.yml`):
```yaml
name: 电商冒烟测试
description: 电商网站关键功能测试
tags: [smoke, e-commerce]
test-cases:
  - test-cases/login.yml
  - test-cases/product-search.yml
  - test-cases/add-to-cart.yml
  - test-cases/checkout.yml
```

**单个测试** (`test-cases/product-search.yml`):
```yaml
tags: [smoke, search]
steps:
  - include: login
  - "Click search field"
  - "Type 'laptop' in search field"
  - "Press Enter"
  - "Verify search results contain 'laptop'"
  - "Verify at least 5 products are displayed"
```

**步骤库** (`steps/login.yml`):
```yaml
description: 标准登录流程
steps:
  - "Navigate to {{BASE_URL}}/login"
  - "Fill username field with {{TEST_USERNAME}}"
  - "Fill password field with {{TEST_PASSWORD}}"
  - "Click login button"
  - "Wait for dashboard to load"
```

**运行套件:**
```bash
/run-test-suite suite:e-commerce.yml env:test
```

### 示例2: 基于标签的测试执行

```bash
# 运行所有冒烟测试
/run-yaml-test tags:smoke env:dev

# 运行同时具有smoke和login标签的测试
/run-yaml-test tags:smoke,login env:dev

# 运行具有smoke或critical标签的测试
/run-yaml-test tags:smoke|critical env:dev

# 在生产环境运行所有测试
/run-yaml-test env:prod
```

### 示例3: 环境配置

**开发环境** (`.env.dev`):
```bash
BASE_URL=http://localhost:3000
TEST_USERNAME=dev@example.com
TEST_PASSWORD=devpass123
GENERATE_REPORT=true
REPORT_STYLE=overview
REPORT_PATH=reports/dev
```

**生产环境** (`.env.prod`):
```bash
BASE_URL=https://prod.example.com
TEST_USERNAME=prod@example.com
TEST_PASSWORD=secureprodpass
GENERATE_REPORT=true
REPORT_STYLE=detailed
REPORT_PATH=reports/prod
```

## 常见问题

### 问: 如何更新我的测试框架？
```bash
claude-test update --backup --verbose
```
这会创建备份并在更新过程中显示详细输出。

### 问: 我的测试失败了，如何调试？
1. 检查框架完整性: `claude-test check --verbose`
2. 验证测试语法: `/validate-yaml-test file:your-test.yml`
3. 使用详细报告运行: 在.env文件中设置 `REPORT_STYLE=detailed`
4. 查看生成的HTML报告: `/view-reports-index`

### 问: 如何创建可复用的测试步骤？
在 `steps/` 目录中创建YAML文件:
```yaml
# steps/common-actions.yml
description: 通用UI操作
steps:
  - "Wait for page to load"
  - "Take screenshot"
  - "Scroll to top of page"
```

然后在测试中包含:
```yaml
# test-cases/my-test.yml
tags: [smoke]
steps:
  - include: common-actions
  - "Click submit button"
```

### 问: 可以并行运行测试吗？
目前测试按顺序运行并进行会话优化。并行执行计划在未来版本中实现。

### 问: 如何处理不同环境？
1. 创建单独的 `.env` 文件: `.env.dev`, `.env.test`, `.env.prod`
2. 在测试中使用环境变量: `{{BASE_URL}}`
3. 运行时指定环境: `/run-yaml-test env:prod`

### 问: 如果框架文件损坏怎么办？
```bash
# 检查问题
claude-test check --fix

# 或者强制重新安装
claude-test init --force
```

### 问: 如何查看历史测试报告？
1. 运行 `/view-reports-index`
2. 在环境标签页间导航（dev/test/prod）
3. 点击任何报告卡片查看详细结果
4. 报告按时间戳组织便于访问

## 故障排除

### 找不到框架
```bash
# 错误: 在当前目录中找不到框架
claude-test init
```

### 版本不匹配
```bash
# 检查版本
claude-test check --verbose

# 更新框架
claude-test update
```

### 权限问题
```bash
# 在macOS/Linux上，全局安装可能需要sudo
sudo npm install -g claude-test
```

### 测试执行失败
1. **验证测试语法**: `/validate-yaml-test file:your-test.yml`
2. **检查环境变量**: 确保所有 `{{VARIABLES}}` 都已定义
3. **验证步骤库**: 确保所有 `include:` 引用都存在
4. **检查Playwright MCP**: 确保Claude Code已集成Playwright

## CLI开发架构

本项目是claude-test框架的**官方CLI工具**，包含：

### 核心组件
- **CLI入口**: `bin/claude-test.js` - 基于Commander.js的三个主要命令
- **命令实现**: `lib/commands/` - init、update、check命令的实现
- **工具函数**: `lib/utils/` - 核心业务逻辑（文件管理、版本控制）
- **模板文件**: `lib/templates/` - 复制到用户项目的框架文件

### 开发脚本
- `npm test` - 运行Jest测试套件，84.95%代码覆盖率
- `npm run lint` - ESLint验证
- `npm run test:coverage` - 覆盖率分析，包含.claude/scripts
- `npm run sync-templates` - 同步框架模板
- `npm run ci` - 完整CI流水线

### 测试
全面的测试覆盖包括：
- 所有核心模块的单元测试
- CLI命令的集成测试
- 错误处理和边界情况验证
- CLI命令执行测试

## 演示和使用示例

**实际使用示例**和**集成演示**请访问配套项目：

📖 **[claude-test-demo](https://github.com/terryso/claude-code-playwright-mcp-test)** - 完整的使用示例、测试用例和集成指南

## 开发和测试

框架包含全面的测试和验证：

- **CLI测试**: 完整的命令验证和集成测试
- **跨平台支持**: 在macOS和Linux上测试
- **版本管理**: 自动兼容性检查
- **错误处理**: 优雅的失败模式和恢复

## 贡献

我们欢迎贡献！提交拉取请求前请阅读我们的贡献指南。

## 技术支持

问题和咨询：

- **GitHub Issues**: [报告Bug](https://github.com/terryso/claude-test/issues)
- **完整文档**: [完整文档](https://github.com/terryso/claude-test#readme)
- **演示项目**: [claude-code-playwright-mcp-test](https://github.com/terryso/claude-code-playwright-mcp-test)
- **Claude Code文档**: [https://docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)

## 许可证

MIT许可证 - 详见 [LICENSE](LICENSE) 文件。

---

**由Anthropic团队为Claude Code社区用❤️制作。**