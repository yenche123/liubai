# 留白LAF后端系统API文档

## 目录

1. [API概览](#api概览)
2. [认证机制](#认证机制)
3. [返回格式](#返回格式)
4. [错误码说明](#错误码说明)
5. [同步操作API](#同步操作api)
6. [用户管理API](#用户管理api)
7. [文件上传API](#文件上传api)
8. [支付相关API](#支付相关api)
9. [Webhook API](#webhook-api)
10. [AI相关API](#ai相关api)
11. [定时任务API](#定时任务api)

## API概览

留白LAF后端系统提供以下主要API分类：

| API类别 | 描述 | 主要功能 |
|---------|------|----------|
| 同步操作API | 管理客户端和服务器之间的数据同步 | 获取和更新内容数据 |
| 用户管理API | 处理用户身份验证和设置 | 用户登录、注册和偏好设置 |
| 文件上传API | 管理文件上传和处理 | 获取上传凭证、文件处理 |
| 支付相关API | 处理订阅和支付 | 创建订阅、管理支付 |
| Webhook API | 处理外部服务回调 | 支付通知、上传回调 |
| AI相关API | AI对话和功能实现 | AI聊天、工具调用 |
| 定时任务API | 执行定时维护操作 | 系统清理、提醒通知 |

## 认证机制

系统使用基于令牌的认证，流程如下：

1. **获取令牌**：用户通过登录API获取认证令牌（token）和序列ID（serial ID）
2. **请求认证**：后续请求在请求体中包含这两个值
3. **令牌验证**：服务器验证令牌有效性和权限
4. **令牌刷新**：令牌30天后过期，但会通过使用自动刷新

### 认证请求格式

```json
{
  "x_liu_token": "tk_xxxxxxxxxx",
  "x_liu_serial": "serial_id",
  "operateType": "操作类型",
  // 其他参数...
}
```

### 令牌验证代码示例

```typescript
// 验证示例
const vRes = await verifyToken(ctx, body)
if(!vRes.pass) return vRes.rqReturn
const user = vRes.userData
```

## 返回格式

所有API都使用统一的JSON返回格式：

```json
{
  "code": "0000",        // 状态码，0000表示成功
  "data": {              // 返回数据，成功时存在
    // 具体返回数据...
  },
  "errMsg": "错误信息",   // 错误信息，失败时存在
  "showMsg": "显示信息"   // 可直接显示给用户的信息，可选
}
```

## 错误码说明

系统使用以下错误码格式：

| 错误码 | 含义 | 说明 |
|--------|------|------|
| 0000 | 成功 | 请求成功处理 |
| 0001 | 部分成功 | 批量操作部分成功 |
| 0002 | 无需执行 | 操作被忽略（如重复请求） |
| E4000 | 参数错误 | 提供的参数不正确 |
| E4003 | 认证失败 | 认证令牌无效或过期 |
| E4004 | 资源不存在 | 请求的资源不存在 |
| E4009 | 权限不足 | 无权执行请求的操作 |
| E5001 | 服务器配置错误 | 服务器配置问题 |
| E5004 | 外部服务错误 | 第三方服务调用失败 |
| SP001-SP009 | 订阅相关错误 | 订阅计划特定错误 |

## 同步操作API

### sync-operate.ts

用于执行特殊操作，如AI交互和获取AI对话内容。

```
路径：/sync-operate
方法：POST
认证：需要
```

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| x_liu_token | string | 是 | 认证令牌 |
| x_liu_serial | string | 是 | 序列ID |
| operateType | string | 是 | 操作类型 |
| [其他参数] | any | 否 | 根据operateType不同而不同 |

#### 操作类型

| operateType | 描述 | 额外参数 |
|-------------|------|----------|
| agree-aichat | 同意AI聊天创建的内容 | chatId: AI聊天ID |
| get-aichat | 获取AI对话内容 | roomId: AI房间ID |
| get-ai-detail | 获取AI详情 | chatId: AI聊天ID |

#### 请求示例

```json
{
  "x_liu_token": "tk_xxxxxxxxxx",
  "x_liu_serial": "serial_id",
  "operateType": "get-aichat",
  "roomId": "room_123456"
}
```

#### 响应示例

```json
{
  "code": "0000",
  "data": {
    "operateType": "get-aichat",
    "chats": [
      {
        "id": "chat_001",
        "role": "user",
        "text": "你好，帮我创建一个待办事项",
        "timestamp": 1636879932000
      },
      {
        "id": "chat_002",
        "role": "assistant",
        "text": "好的，我可以帮您创建待办事项。请问您想创建什么内容的待办事项？",
        "timestamp": 1636879938000
      }
    ]
  }
}
```

### sync-set.ts

用于将客户端变更同步到服务器，如创建和更新内容。

```
路径：/sync-set
方法：POST
认证：需要
```

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| x_liu_token | string | 是 | 认证令牌 |
| x_liu_serial | string | 是 | 序列ID |
| operateType | string | 是 | 操作类型，通常为"general_sync" |
| atoms | Array | 是 | 同步原子操作数组 |

#### atoms参数结构

每个原子操作包含以下字段：

```json
{
  "type": "atom_type",        // 原子操作类型
  "id": "unique_id",          // 操作唯一标识符
  "payload": {                // 操作负载
    // 具体操作数据...
  }
}
```

#### 支持的原子操作类型

| 原子类型 | 描述 |
|----------|------|
| add_thread | 添加线程（帖子、笔记等） |
| edit_thread | 编辑线程 |
| delete_thread | 删除线程 |
| add_comment | 添加评论 |
| edit_comment | 编辑评论 |
| delete_comment | 删除评论 |
| add_collection | 添加收藏 |
| remove_collection | 移除收藏 |
| add_tag | 添加标签 |
| remove_tag | 移除标签 |
| set_workspace_state | 设置工作区状态 |
| save_draft | 保存草稿 |
| delete_draft | 删除草稿 |

#### 请求示例

```json
{
  "x_liu_token": "tk_xxxxxxxxxx",
  "x_liu_serial": "serial_id",
  "operateType": "general_sync",
  "atoms": [
    {
      "type": "add_thread",
      "id": "op_12345",
      "payload": {
        "title": "测试笔记",
        "content": "这是一个测试笔记内容",
        "threadType": "note"
      }
    }
  ]
}
```

#### 响应示例

```json
{
  "code": "0000",
  "data": [
    {
      "id": "op_12345",
      "success": true,
      "data": {
        "threadId": "thread_67890"
      }
    }
  ]
}
```

### sync-get.ts

用于从服务器获取数据，如内容列表、评论等。

```
路径：/sync-get
方法：POST
认证：需要
```

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| x_liu_token | string | 是 | 认证令牌 |
| x_liu_serial | string | 是 | 序列ID |
| operateType | string | 是 | 操作类型，通常为"general_sync" |
| atoms | Array | 是 | 同步原子操作数组 |

#### 支持的原子操作类型

| 原子类型 | 描述 |
|----------|------|
| get_threads | 获取线程列表 |
| get_thread | 获取单个线程 |
| get_comments | 获取评论列表 |
| get_collections | 获取收藏列表 |
| get_tags | 获取标签列表 |
| get_drafts | 获取草稿列表 |
| get_workspace_state | 获取工作区状态 |

#### 请求示例

```json
{
  "x_liu_token": "tk_xxxxxxxxxx",
  "x_liu_serial": "serial_id",
  "operateType": "general_sync",
  "atoms": [
    {
      "type": "get_threads",
      "id": "op_67890",
      "payload": {
        "spaceId": "space_12345",
        "limit": 20,
        "offset": 0,
        "threadType": "note"
      }
    }
  ]
}
```

#### 响应示例

```json
{
  "code": "0000",
  "data": [
    {
      "id": "op_67890",
      "success": true,
      "data": {
        "threads": [
          {
            "id": "thread_12345",
            "title": "测试笔记",
            "preview": "这是一个测试笔记内容",
            "createdAt": 1636879932000,
            "updatedAt": 1636879932000
          }
        ],
        "total": 1
      }
    }
  ]
}
```

## 用户管理API

### user-login.ts

用于用户登录和注册操作。

```
路径：/user-login
方法：POST
认证：部分需要（取决于操作类型）
```

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| operateType | string | 是 | 操作类型 |
| [其他参数] | any | 否 | 根据operateType不同而不同 |

#### 操作类型

| operateType | 描述 | 额外参数 |
|-------------|------|----------|
| init | 初始化登录界面 | 无 |
| github_oauth | GitHub OAuth登录 | code: GitHub授权码 |
| google_oauth | Google OAuth登录 | code: Google授权码 |
| wx_gzh_oauth | 微信公众号OAuth登录 | code: 微信授权码 |
| email | 发送电子邮件验证码 | email: 邮箱地址 |
| email_code | 通过邮箱验证码登录 | email: 邮箱地址<br>code: 验证码 |
| phone | 发送短信验证码 | phone: 手机号 |
| phone_code | 通过手机验证码登录 | phone: 手机号<br>code: 验证码 |
| users_select | 选择用户登录 | client_key: 客户端标识<br>user_id: 用户ID |
| wx_gzh_scan | 微信公众号扫码 | scan_type: 扫码类型 |
| scan_check | 扫码检查 | credential: 扫码凭证 |
| scan_login | 扫码登录 | credential: 扫码凭证 |

#### 请求示例（邮箱验证码登录）

```json
{
  "operateType": "email_code",
  "email": "user@example.com",
  "code": "123456",
  "client_key": "web_browser_chrome"
}
```

#### 响应示例（登录成功）

```json
{
  "code": "0000",
  "data": {
    "token": "tk_xxxxxxxxxx",
    "serial": "serial_id",
    "user": {
      "id": "user_12345",
      "name": "张三",
      "avatar": "https://example.com/avatar.jpg",
      "email": "user@example.com"
    }
  }
}
```

### user-settings.ts

用于管理用户设置和偏好。

```
路径：/user-settings
方法：POST
认证：大部分需要（除了部分公开操作）
```

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| x_liu_token | string | 条件 | 认证令牌（部分操作需要） |
| x_liu_serial | string | 条件 | 序列ID（部分操作需要） |
| operateType | string | 是 | 操作类型 |
| [其他参数] | any | 否 | 根据operateType不同而不同 |

#### 操作类型

| operateType | 描述 | 额外参数 | 认证要求 |
|-------------|------|----------|----------|
| enter | 用户进入 | 无 | 需要 |
| latest | 获取最新状态 | 无 | 需要 |
| membership | 获取会员状态 | 无 | 需要 |
| set | 设置主题/语言等 | settings: 设置对象 | 需要 |
| wechat-bind | 绑定微信公众号 | 无 | 需要 |
| request-sms | 请求短信验证码 | phone: 手机号 | 需要 |
| bind-phone | 绑定手机号 | phone: 手机号<br>code: 验证码 | 需要 |
| unbind-phone | 解绑手机号 | 无 | 需要 |
| unbind-email | 解绑邮箱 | 无 | 需要 |
| unbind-wx_gzh | 解绑微信公众号 | 无 | 需要 |
| logout | 登出 | 无 | 需要 |

#### 请求示例（设置语言）

```json
{
  "x_liu_token": "tk_xxxxxxxxxx",
  "x_liu_serial": "serial_id",
  "operateType": "set",
  "settings": {
    "lang": "zh-Hans",
    "theme": "light"
  }
}
```

#### 响应示例

```json
{
  "code": "0000",
  "data": {
    "settings": {
      "lang": "zh-Hans",
      "theme": "light"
    }
  }
}
```

## 文件上传API

### file-set.ts

用于获取文件上传凭证和管理文件。

```
路径：/file-set
方法：POST
认证：需要
```

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| x_liu_token | string | 是 | 认证令牌 |
| x_liu_serial | string | 是 | 序列ID |
| operateType | string | 是 | 操作类型 |
| [其他参数] | any | 否 | 根据operateType不同而不同 |

#### 操作类型

| operateType | 描述 | 额外参数 |
|-------------|------|----------|
| get-upload-token | 获取上传凭证 | 无 |
| get-upload-sts | 获取STS凭证（阿里云等） | 无 |

#### 请求示例

```json
{
  "x_liu_token": "tk_xxxxxxxxxx",
  "x_liu_serial": "serial_id",
  "operateType": "get-upload-token"
}
```

#### 响应示例

```json
{
  "code": "0000",
  "data": {
    "cloudService": "qiniu",
    "uploadToken": "qiniu-upload-token",
    "prefix": "users/user_12345-random_string"
  }
}
```

### 文件处理工具(file-utils.ts)

以下是文件处理工具提供的主要功能：

#### downloadFile

下载网络文件。

```typescript
async function downloadFile(url: string): Promise<any>
```

#### uploadToQiniu

将文件上传到七牛云存储。

```typescript
async function uploadToQiniu(
  key: string,
  uint8arr: Uint8Array,
  token: string
): Promise<any>
```

#### downloadAndUpload

下载文件并上传到云存储。

```typescript
async function downloadAndUpload(
  file_url: string,
  user_id: string
): Promise<any>
```

#### 微信公众号媒体上传

上传文件到微信公众号作为临时素材。

```typescript
// 上传网络图片为微信公众号临时素材
async function mediaByUrl(file_url: string): Promise<any>
```

## 支付相关API

### subscribe-plan.ts

管理用户的订阅计划和支付。

```
路径：/subscribe-plan
方法：POST
认证：需要
```

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| x_liu_token | string | 是 | 认证令牌 |
| x_liu_serial | string | 是 | 序列ID |
| operateType | string | 是 | 操作类型 |
| [其他参数] | any | 否 | 根据operateType不同而不同 |

#### 操作类型

| operateType | 描述 | 额外参数 |
|-------------|------|----------|
| info | 获取订阅信息 | 无 |
| create_stripe | 创建Stripe结账会话 | plan: 订阅计划("monthly"/"quarterly"/"yearly") |
| create_wxpay | 创建微信支付订单 | plan: 订阅计划 |
| create_alipay | 创建支付宝订单 | plan: 订阅计划 |
| cancel_and_refund | 取消并退款 | 无 |

#### 请求示例（创建Stripe会话）

```json
{
  "x_liu_token": "tk_xxxxxxxxxx",
  "x_liu_serial": "serial_id",
  "operateType": "create_stripe",
  "plan": "monthly"
}
```

#### 响应示例

```json
{
  "code": "0000",
  "data": {
    "checkout_url": "https://checkout.stripe.com/pay/xxx"
  }
}
```

## Webhook API

### 七牛云回调(webhook-qiniu.ts)

处理七牛云上传回调，记录用户配额。

```
路径：/webhook-qiniu
方法：POST
认证：不需要（使用七牛云密钥验证）
```

#### 请求参数

七牛云上传完成后发送的回调请求，包含文件信息。

#### 主要功能

- 验证七牛云回调签名
- 记录用户文件上传量
- 更新用户存储配额

### 微信支付回调(webhook-wxpay.ts)

处理微信支付回调事件。

```
路径：/webhook-wxpay
方法：POST
认证：不需要（使用微信支付证书验证）
```

#### 请求参数

微信支付平台发送的支付结果通知。

#### 主要功能

- 验证微信支付通知签名
- 处理支付成功事件
- 处理退款事件
- 更新订单状态
- 升级用户订阅

### 支付宝回调(webhook-alipay.ts)

处理支付宝支付回调。

```
路径：/webhook-alipay
方法：POST
认证：不需要（使用支付宝签名验证）
```

#### 请求参数

支付宝平台发送的交易通知。

#### 主要功能

- 验证支付宝通知签名
- 处理交易成功事件
- 更新订单状态
- 升级用户订阅

### Stripe回调(webhook-stripe.ts)

处理Stripe支付和订阅事件。

```
路径：/webhook-stripe
方法：POST
认证：不需要（使用Stripe签名验证）
```

#### 请求参数

Stripe平台发送的事件通知。

#### 主要功能

- 验证Stripe Webhook签名
- 处理以下事件类型:
  - `checkout.session.completed`: 支付完成
  - `invoice.paid`: 发票支付
  - `invoice.payment_failed`: 支付失败
  - `customer.subscription.created`: 订阅创建
  - `customer.subscription.updated`: 订阅更新
  - `customer.subscription.deleted`: 订阅取消

### 微信公众号回调(webhook-wechat.ts)

处理微信公众号消息和事件。

```
路径：/webhook-wechat
方法：GET/POST
认证：不需要（使用微信Token验证）
```

#### GET请求参数

用于微信公众号服务器验证。

| 参数名 | 类型 | 描述 |
|--------|------|------|
| signature | string | 微信加密签名 |
| timestamp | string | 时间戳 |
| nonce | string | 随机数 |
| echostr | string | 随机字符串 |

#### POST请求参数

微信服务器推送的XML消息，包含以下类型：

- 文本消息
- 图片消息
- 语音消息
- 视频消息
- 位置消息
- 链接消息
- 各类事件（关注、取消关注、点击菜单等）

#### 主要功能

- 处理用户发送的消息
- 处理关注/取消关注事件
- 处理菜单点击事件
- 处理扫码事件
- 将用户消息转发给AI处理
- 发送自动回复和通知

### 企业微信回调(webhook-wecom.ts)

处理企业微信消息和事件。

```
路径：/webhook-wecom
方法：GET/POST
认证：不需要（使用企业微信Token验证）
```

#### 主要功能

- 处理添加外部联系人事件
- 处理企业微信消息
- 发送欢迎消息
- 更新用户企业微信关联信息

## AI相关API

### ai-entrance.ts

AI功能入口，处理AI交互请求。

```
路径：/ai-entrance
方法：POST
认证：需要
```

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| x_liu_token | string | 条件 | 认证令牌（用户登录时需要） |
| x_liu_serial | string | 条件 | 序列ID（用户登录时需要） |
| entry | object | 是 | AI入口对象 |

#### entry对象结构

```json
{
  "user": "用户对象（已登录情况）",
  "msg_type": "消息类型（text/voice/image）",
  "text": "文本内容（msg_type为text时）",
  "voice_url": "语音URL（msg_type为voice时）",
  "image_url": "图片URL（msg_type为image时）",
  "wx_gzh_openid": "微信公众号OpenID（微信场景）",
  "room_id": "房间ID（继续对话时）"
}
```

#### 请求示例

```json
{
  "x_liu_token": "tk_xxxxxxxxxx",
  "x_liu_serial": "serial_id",
  "entry": {
    "msg_type": "text",
    "text": "帮我创建一个待办事项：明天上午9点开会",
    "room_id": "room_12345"
  }
}
```

#### 响应示例

```json
{
  "code": "0000",
  "data": {
    "messages": [
      {
        "id": "msg_12345",
        "role": "assistant",
        "content": "我已为您创建了一个待办事项：明天上午9点开会。您需要我为这个会议添加具体的描述或地点信息吗？",
        "timestamp": 1636879938000
      }
    ],
    "room_id": "room_12345",
    "tool_calls": [
      {
        "id": "call_12345",
        "function": {
          "name": "add_todo",
          "arguments": {
            "title": "开会",
            "description": "",
            "date": "2023-11-15",
            "time": "09:00",
            "reminder": true
          }
        }
      }
    ]
  }
}
```

#### 支持的AI模型

AI系统支持多种AI大模型：

- 百小应（百川智能）
- DeepSeek（深度求索）
- 海螺（MiniMax）
- 混元（腾讯）
- Kimi（月之暗面）
- 通义千问（阿里云）
- 万知（零一万物）
- 跃问（阶跃星辰）
- 智谱（智谱AI）

#### AI工具能力

AI助手提供以下工具能力：

- `web_search`: 网络搜索
- `draw_picture`: 绘制图片
- `add_note`: 添加笔记
- `add_todo`: 添加待办事项
- `add_calendar`: 添加日历事件
- `get_schedule`: 获取日程
- `get_cards`: 获取卡片信息

## 定时任务API

定时任务不向外部提供API接口，但它们是系统重要组成部分，在这里提供说明。

### clock-half-hr.ts

每30分钟执行一次的维护任务。

#### 主要功能

- 清理过期的企业微信绑定凭证
- 清理登录状态（数据库和内存）
- 清理过期的令牌用户信息
- 清理过期订单
- 更新安全设置如IP黑名单

### clock-one-hr.ts

每小时执行一次的维护任务。

#### 主要功能

- 清理过期凭证
- 清理草稿
- 清理令牌
- 更新微信公众号和企业微信访问令牌
- 更新微信支付证书
- 每月1日0点更新用户配额
- 收集和记录系统统计信息

### clock-per-min.ts

每分钟执行一次的任务。

#### 主要功能

- 发送提醒通知
- 处理日程提醒
- 推送重要消息

#### 提醒通知实现

```typescript
// 发送提醒通知示例
async function sendReminders() {
  const now = getNowStamp();
  const nowDate = new Date(now);
  
  // 查找需要提醒的内容
  const contents = await contentCol
    .where({
      infoType: "THREAD",
      threadType: "calendar",
      reminderStamp: _.lte(now + MINUTE),
      reminded: false
    })
    .get();
  
  // 发送提醒
  for (const content of contents.data) {
    // 获取用户
    const user = await userCol.doc(content.user).get();
    
    // 发送微信模板消息
    if (user.wx_gzh_openid) {
      await sendWxTemplateMessage(user.wx_gzh_openid, {
        title: content.title,
        time: formatDate(content.calendarDate),
        remark: content.description || ""
      });
    }
    
    // 标记为已提醒
    await contentCol.doc(content._id).update({
      reminded: true
    });
  }
}
```
