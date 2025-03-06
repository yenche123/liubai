# 留白LAF后端系统构建指南

## 目录

1. [准备工作](#准备工作)
2. [环境配置](#环境配置)
   - [Windows环境配置](#windows环境配置)
   - [macOS环境配置](#macos环境配置)
   - [Linux环境配置](#linux环境配置)
3. [开发工具配置](#开发工具配置)
   - [Visual Studio Code配置](#visual-studio-code配置)
   - [IntelliJ IDEA配置](#intellij-idea配置)
   - [WebStorm配置](#webstorm配置)
4. [项目构建](#项目构建)
   - [获取源码](#获取源码)
   - [安装依赖](#安装依赖)
   - [配置环境变量](#配置环境变量)
   - [编译项目](#编译项目)
5. [部署到LAF平台](#部署到laf平台)
   - [创建LAF应用](#创建laf应用)
   - [上传云函数](#上传云函数)
   - [配置触发器](#配置触发器)
   - [配置WebHook](#配置webhook)
6. [功能验证](#功能验证)
7. [常见问题解决方案](#常见问题解决方案)
8. [附录：核心文件功能说明](#附录核心文件功能说明)

## 准备工作

在开始构建留白LAF后端系统之前，您需要完成以下准备工作：

1. **LAF平台账户**：注册[LAF平台](https://laf.run/)账户并熟悉基本操作
2. **开发环境**：安装Node.js (v14.x或更高版本)
3. **第三方服务账户**：根据需求准备以下服务账户
   - 七牛云账户（文件存储）
   - 微信公众平台账户（如需微信集成）
   - 支付服务账户（Stripe、微信支付、支付宝等）
   - AI服务提供商账户（百川、智谱等）
4. **基础知识**：了解TypeScript、MongoDB和云函数基础知识

## 环境配置

### Windows环境配置

1. **安装Node.js和npm**
   - 访问[Node.js官网](https://nodejs.org/)下载并安装LTS版本
   - 安装完成后，打开命令提示符或PowerShell验证安装：
     ```
     node -v
     npm -v
     ```

2. **安装Git**
   - 访问[Git官网](https://git-scm.com/download/win)下载Windows版本
   - 运行安装程序，选择默认配置
   - 安装完成后，打开命令提示符验证安装：
     ```
     git --version
     ```

3. **安装pnpm**（推荐的包管理器）
   - 打开命令提示符或PowerShell
   - 执行以下命令安装pnpm：
     ```
     npm install -g pnpm
     ```
   - 验证安装：
     ```
     pnpm --version
     ```

4. **安装开发工具**
   - 根据个人偏好安装VS Code、IntelliJ IDEA或WebStorm

### macOS环境配置

1. **安装Homebrew**（如果未安装）
   - 打开终端
   - 运行以下命令：
     ```
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     ```

2. **安装Node.js和npm**
   - 使用Homebrew安装：
     ```
     brew install node
     ```
   - 验证安装：
     ```
     node -v
     npm -v
     ```

3. **安装Git**（macOS通常预装了Git）
   - 验证Git是否已安装：
     ```
     git --version
     ```
   - 如未安装，使用Homebrew安装：
     ```
     brew install git
     ```

4. **安装pnpm**
   - 执行以下命令：
     ```
     npm install -g pnpm
     ```
   - 验证安装：
     ```
     pnpm --version
     ```

5. **安装开发工具**
   - 下载并安装选择的IDE（VS Code、IntelliJ IDEA或WebStorm）

### Linux环境配置

以Ubuntu为例：

1. **安装Node.js和npm**
   - 添加Node.js官方PPA：
     ```
     curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
     ```
   - 安装Node.js：
     ```
     sudo apt-get install -y nodejs
     ```
   - 验证安装：
     ```
     node -v
     npm -v
     ```

2. **安装Git**
   - 通常预装，验证：
     ```
     git --version
     ```
   - 如未安装：
     ```
     sudo apt-get install git
     ```

3. **安装pnpm**
   - 执行以下命令：
     ```
     npm install -g pnpm
     ```
   - 验证安装：
     ```
     pnpm --version
     ```

4. **安装开发工具**
   - 下载并安装选择的IDE

## 开发工具配置

### Visual Studio Code配置

1. **安装VS Code**
   - 从[官网](https://code.visualstudio.com/)下载并安装

2. **安装推荐扩展**
   - 打开VS Code
   - 点击扩展图标或按`Ctrl+Shift+X`(Windows/Linux)或`Cmd+Shift+X`(macOS)
   - 搜索并安装以下扩展：
     - ESLint
     - Prettier - Code formatter
     - TypeScript Vue Plugin (Volar)
     - MongoDB for VS Code
     - Thunder Client (REST客户端)

3. **配置TypeScript支持**
   - 打开VS Code设置（`Ctrl+,`或`Cmd+,`）
   - 搜索"typescript"
   - 确保TypeScript验证已启用

4. **设置终端**
   - 打开新终端（`` Ctrl+` ``或`` Cmd+` ``）
   - 确保能够运行pnpm命令

### IntelliJ IDEA配置

1. **安装IntelliJ IDEA**
   - 从[JetBrains官网](https://www.jetbrains.com/idea/download/)下载并安装

2. **安装NodeJS插件**
   - 打开IDEA
   - 转到设置/首选项（`Ctrl+Alt+S`或`Cmd+,`）
   - 选择插件
   - 搜索并安装"Node.js"插件

3. **配置TypeScript支持**
   - 在设置中搜索"TypeScript"
   - 确保TypeScript服务已启用
   - 配置TypeScript编译器路径（通常自动配置）

4. **配置MongoDB支持**
   - 安装"MongoDB Integration"插件
   - 配置数据库连接（如需本地开发）

### WebStorm配置

1. **安装WebStorm**
   - 从[JetBrains官网](https://www.jetbrains.com/webstorm/download/)下载并安装

2. **配置Node.js和npm**
   - 打开WebStorm
   - 转到设置/首选项（`Ctrl+Alt+S`或`Cmd+,`）
   - 转到语言和框架 > Node.js and npm
   - 确认Node.js解释器路径已正确配置

3. **配置TypeScript**
   - 在设置中搜索"TypeScript"
   - 确保TypeScript服务已启用
   - 验证TypeScript版本和编译选项

4. **安装MongoDB插件**（可选）
   - 如果需要本地数据库管理，安装"MongoDB Integration"插件

## 项目构建

### 获取源码

1. **克隆项目仓库**
   - 打开终端或命令提示符
   - 导航到您想存放代码的目录
   - 执行Git克隆命令：
     ```
     git clone <留白LAF项目仓库URL>
     ```
   - 进入项目目录：
     ```
     cd liubai-laf
     ```

2. **查看项目结构**
   - 确认项目包含以下主要目录和文件：
     - `functions/`: 所有云函数代码
     - `types/`: TypeScript类型定义
     - `utils/`: 实用工具函数
     - `package.json`: 项目依赖配置
     - `tsconfig.json`: TypeScript配置

### 安装依赖

1. **使用pnpm安装依赖**
   - 在项目根目录执行：
     ```
     pnpm install
     ```
   - 这将安装项目所需的所有依赖项

2. **安装特定云函数依赖**（如果需要）
   - 某些云函数可能需要特定依赖
   - 进入特定云函数目录：
     ```
     cd functions/<function-name>
     pnpm install
     ```

### 配置环境变量

1. **创建环境变量文件**
   - 复制示例环境变量文件：
     ```
     cp .env.template .env
     ```

2. **配置必要环境变量**
   - 使用文本编辑器打开`.env`文件
   - 填写以下必要环境变量：
     - 基本配置（`LIU_DOMAIN`, `LIU_TIMEZONE`等）
     - 七牛云配置（`LIU_QINIU_ACCESS_KEY`等）
     - 微信配置（如需微信集成）
     - 支付配置（如需支付功能）
     - AI模型配置（如需AI功能）

3. **配置敏感信息**
   - 创建`secret-config.ts`文件：
     ```typescript
     export const wxpay_apiclient_serial_no = ""
     export const wxpay_apiclient_cert = ""
     export const wxpay_apiclient_key = ""

     export const alipay_cfg = {
       privateKey: "",
       alipayPublicKey: "",
     }
     ```
   - 填入相应的敏感信息

### 编译项目

1. **TypeScript编译**
   - 在项目根目录执行：
     ```
     pnpm build
     ```
   - 或执行TypeScript编译：
     ```
     tsc
     ```

2. **验证编译结果**
   - 检查`dist`目录（如果存在）
   - 确认没有编译错误

## 部署到LAF平台

### 创建LAF应用

1. **登录LAF平台**
   - 访问[LAF控制台](https://console.laf.run/)
   - 使用您的账户登录

2. **创建新应用**
   - 点击"新建应用"
   - 填写应用名称
   - 选择合适的区域
   - 选择MongoDB版本
   - 点击"创建"

3. **进入应用管理**
   - 点击新创建的应用

### 上传云函数

1. **创建并上传基础云函数**
   - 在LAF控制台，点击"云函数"
   - 首先创建初始化函数：
     - 创建`__init__.ts`云函数
     - 将本地`functions/__init__.ts`代码复制到编辑器中
     - 点击"部署"

   - 创建拦截器函数：
     - 创建`__interceptor__.ts`云函数
     - 将本地`functions/__interceptor__.ts`代码复制到编辑器中
     - 点击"部署"

2. **上传其余云函数**
   - 按以下顺序上传其余云函数：
     - 同步操作API: `sync-operate.ts`, `sync-set.ts`, `sync-get.ts`
     - 用户管理API: `user-login.ts`, `user-settings.ts`
     - 文件操作API: `file-set.ts`, `file-utils.ts`
     - 支付相关API: `subscribe-plan.ts`
     - Webhook函数: `webhook-qiniu.ts`, `webhook-wxpay.ts`, `webhook-alipay.ts`, `webhook-stripe.ts`, `webhook-wechat.ts`, `webhook-wecom.ts`
     - AI相关API: `ai-entrance.ts`
     - 定时任务: `clock-half-hr.ts`, `clock-one-hr.ts`, `clock-per-min.ts`

3. **配置云函数环境变量**
   - 在LAF控制台，点击"应用设置"
   - 选择"环境变量"
   - 添加`.env`文件中的所有变量
   - 点击"保存"

### 配置触发器

1. **设置定时任务触发器**
   - 在LAF控制台，点击"触发器"
   - 点击"创建触发器"
   - 为`clock-half-hr.ts`创建触发器：
     - 类型：定时触发
     - 表达式：`0 */30 * * * *`（每30分钟）
     - 触发函数：`clock-half-hr`
     - 点击"确定"

   - 为`clock-one-hr.ts`创建触发器：
     - 类型：定时触发
     - 表达式：`0 0 * * * *`（每小时）
     - 触发函数：`clock-one-hr`
     - 点击"确定"

   - 为`clock-per-min.ts`创建触发器：
     - 类型：定时触发
     - 表达式：`0 * * * * *`（每分钟）
     - 触发函数：`clock-per-min`
     - 点击"确定"

### 配置WebHook

1. **获取云函数URL**
   - 在LAF控制台，点击"云函数"
   - 找到Webhook相关函数
   - 复制函数的访问URL

2. **配置第三方服务回调**
   - 七牛云：配置`webhook-qiniu`URL为回调地址
   - 微信支付：配置`webhook-wxpay`URL为回调地址
   - 支付宝：配置`webhook-alipay`URL为回调地址
   - Stripe：配置`webhook-stripe`URL为回调地址
   - 微信公众号：配置`webhook-wechat`URL为回调地址
   - 企业微信：配置`webhook-wecom`URL为回调地址

## 功能验证

1. **初始化系统**
   - 通过接口直接调用`__init__`函数
   - 或在LAF控制台手动运行`__init__`函数

2. **验证基本API功能**
   - 使用API测试工具（如Postman或Thunder Client）
   - 测试以下API：
     - 用户登录API
     - 同步操作API
     - 文件上传API

3. **验证WebHook功能**
   - 测试七牛云文件上传回调
   - 测试支付回调（可使用测试环境）
   - 测试微信公众号消息接收

4. **验证定时任务**
   - 检查定时任务日志
   - 确认任务按预期执行

## 常见问题解决方案

1. **环境变量配置问题**
   - 问题：云函数无法正确读取环境变量
   - 解决方案：
     - 检查LAF平台环境变量配置
     - 确保变量名称与代码中使用的名称一致
     - 重新部署相关云函数

2. **TypeScript编译错误**
   - 问题：代码无法编译或编译后运行出错
   - 解决方案：
     - 检查TypeScript版本兼容性
     - 确保`tsconfig.json`配置正确
     - 解决代码中的类型错误

3. **依赖项问题**
   - 问题：云函数运行时报错缺少依赖
   - 解决方案：
     - 在LAF平台云函数编辑器中安装缺失依赖
     - 检查依赖版本兼容性
     - 考虑使用LAF的依赖管理功能

4. **WebHook配置问题**
   - 问题：第三方服务回调未触发相应函数
   - 解决方案：
     - 验证回调URL是否正确
     - 检查回调请求格式是否符合要求
     - 查看云函数日志确认是否收到请求

5. **七牛云上传问题**
   - 问题：文件上传失败或回调处理错误
   - 解决方案：
     - 检查七牛云配置参数
     - 验证上传凭证生成是否正确
     - 确保回调URL公网可访问

6. **微信公众号集成问题**
   - 问题：微信消息处理失败
   - 解决方案：
     - 验证Token和密钥配置
     - 检查公众号接口权限
     - 查看云函数日志了解具体错误

7. **AI模型调用问题**
   - 问题：AI模型调用失败
   - 解决方案：
     - 检查API密钥配置
     - 验证请求格式是否符合模型要求
     - 检查网络连接和防火墙设置

## 附录：核心文件功能说明

- **`__init__.ts`**: 系统初始化，生成安全密钥
- **`__interceptor__.ts`**: 请求拦截器，处理安全验证和速率限制
- **`sync-*.ts`**: 数据同步相关API
- **`user-*.ts`**: 用户认证和设置管理
- **`file-*.ts`**: 文件上传和管理
- **`ai-entrance.ts`**: AI功能入口
- **`webhook-*.ts`**: 各类外部服务回调处理
- **`clock-*.ts`**: 定时任务处理

