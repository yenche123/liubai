# Chrome DevTools 性能与 PWA 评估流程

本文用于评估 `liubai-web` 的客户端导航、编辑器页面、PWA 生命周期和接口请求。流程基于 Chrome DevTools 153/154 之后的能力，尤其是 soft navigation、CPU performance tier override、Heap Snapshot 查询和 PWA 自动化。

## 1. 准备环境

在 `liubai-web` 目录启动开发服务器：

```bash
bun run dev
```

需要验证生产资源时，使用：

```bash
bun run build
bun run preview
```

在 Chrome 中打开终端输出的地址。开发服务器默认端口是 `5175`，预览服务器默认端口是 `4175`。

### 可选：配置 Chrome DevTools MCP

Chrome DevTools MCP 应作为本地开发工具运行，不要加入 Liubai 的运行时依赖。遵守仓库的 Bun 约束时，可以在 MCP 客户端配置：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "bunx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--isolated",
        "--no-usage-statistics",
        "--no-performance-crux"
      ]
    }
  }
}
```

只做只读检查时，可以追加 `--no-javascript-evaluation`。不要启用允许任意文件系统路径的选项；浏览器登录态、请求内容和 DevTools MCP 都可能包含敏感数据。

## 2. 固定测试条件

每次比较都记录以下信息：

- Chrome 版本、操作系统和是否使用无痕窗口；
- `dev` 还是 `preview`，commit ID 和构建时间；
- Device Mode 设备预设；
- CPU 档位。优先使用 CDP 的 CPU performance tier override；不可用时使用 DevTools 的 CPU throttling；
- 是否有登录态、是否已有 Service Worker 和缓存。

首次建立基线时，建议使用同一台电脑、同一个 Chrome 配置和同一个测试账号。真实 iOS、iPadOS 和微信 WebView 的问题仍需在真实设备上复测，Device Mode 只用于快速回归。

## 3. 固定用户路径

每条路径先执行一次预热，再执行三次正式采样。正式采样前清空 Performance 面板记录，不要在采样中打开 DevTools 的 Elements 或 Console 频繁操作页面。

### A. 首页和客户端导航

1. 冷启动首页；
2. 首页 → 工作空间/状态页；
3. 状态页 → 详情页；
4. 详情页 → 编辑器；
5. 使用返回、前进和侧边栏再次切换。

在 Performance 面板录制 trace，查看 Insights 中的 soft navigation。Liubai 会在 Performance Timeline 写入以下条目，帮助把 trace 对应到路由：

```text
liubai:soft-nav:<route>:<id>:start
liubai:soft-nav:<route>:<id>:resolved
liubai:soft-nav:<route>:<id>:paint
liubai:soft-nav:<route>:<id>:router
liubai:soft-nav:<route>:<id>:paint-duration
```

也可以在 Console 中查看最近的测量：

```js
performance.getEntriesByType("measure")
  .filter((entry) => entry.name.startsWith("liubai:soft-nav:"))
  .map((entry) => ({ name: entry.name, duration: entry.duration }))
```

其中 `router` 从客户端导航追踪钩子开始计时，覆盖其后的路由守卫、异步组件和路由解析；`paint-duration` 会在 Vue 更新后等待一次浏览器绘制机会再记录。两者都不等于完整的真实用户体验指标，LCP、INP 和 Long Task 仍以 Performance 面板的 soft navigation Insights 为准。

### B. 编辑器和长页面

1. 打开一个包含较多块、图片或评论的编辑页面；
2. 输入、粘贴、撤销和切换编辑模式；
3. 离开编辑器，再进入另一个编辑器；
4. 重复切换 10–20 次；
5. 在 Performance trace 中检查长任务、脚本执行和布局抖动。

重点观察编辑器初始化、内容解析、图片加载和 `keep-alive` 页面恢复是否阻塞交互。

### C. 搜索和滚动

1. 打开搜索入口并输入查询；
2. 快速修改查询词；
3. 在结果和详情页之间来回切换；
4. 连续滚动包含图片、评论或虚拟内容的页面。

重点观察输入期间的 INP、主线程长任务、网络瀑布和重复请求。

## 4. Heap Snapshot 检查

在完成路径 B 后暂停操作，打开 Memory → Heap snapshot，至少采集三次：

1. 初始状态；
2. 重复打开、离开编辑器 10–20 次后；
3. 回到首页并等待 10 秒后。

优先使用 retained size 和属性名查询以下对象：

- 编辑器实例、ProseMirror/Tiptap 节点；
- 路由组件和 `keep-alive` 缓存；
- 事件监听器、定时器和 ResizeObserver；
- 图片 Blob、ArrayBuffer 和大型字符串；
- Dexie 查询结果或同步缓存。

如果第三次快照仍保留大量只属于已离开页面的对象，记录对象的 retaining path，再决定是页面缓存策略、监听器清理还是业务缓存的问题。不要仅凭一次快照下结论。

## 5. PWA 和 Service Worker 检查

在 Application 面板按以下顺序验证：

1. 安装或重新加载 Service Worker；
2. 确认更新提示仍遵循当前的 `registerType: "prompt"` 行为；
3. 在离线状态重新加载首页和已访问页面；
4. 恢复联网后检查新版本是否能激活；
5. 点击 Web Push 通知，确认能回到通知中的目标 URL；
6. 检查 `/lib/` 资源没有被错误地当作应用导航回退到 `index.html`。

每次 PWA 回归都记录 Service Worker 的版本、Cache Storage 条目和是否存在旧客户端。不要在没有记录版本的情况下直接清除所有站点数据。

## 6. Network 请求重放

在 Network 面板选择目标请求，使用 **Edit and resend as fetch**：

- 修改分页、查询或同步参数，确认后端错误信息是否清晰；
- 验证过期 token、缺少 workspace 参数和空响应的前端处理；
- 检查请求重放不会意外重复写入数据；
- 对二进制或压缩 payload，记录实际解码方式。

写操作只使用测试账号和测试数据。重放前确认请求是否会创建、更新或删除服务端数据。

## 7. 结果记录与发布判断

每次评估至少记录：

| 字段 | 内容 |
| --- | --- |
| 版本 | commit ID、`dev`/`preview`、构建时间 |
| 环境 | Chrome、系统、设备预设、CPU 档位 |
| 路径 | A/B/C 中的具体步骤 |
| 性能 | soft navigation 的 LCP、INP、Long Task，及 `paint-duration` |
| 内存 | 三次 Heap Snapshot 的 retained size 差异 |
| PWA | 安装、更新、离线、Push 点击结果 |
| 网络 | 重放请求、响应状态和是否产生副作用 |
| 结论 | 与上一个基线相比的变化和 trace 链接 |

第一阶段先建立基线，不把未经多次采样验证的绝对阈值当作发布门禁。后续可以在同一设备和 CPU 档位下，以基线的 p75 为基准：性能指标回退超过 10%、已离开页面对象持续增长，或 PWA 更新/离线流程失败时，进入发布前复查。

## 参考

- [Chrome DevTools：New in DevTools – October 2026](https://developer.chrome.com/blog/new-in-devtools-october-2026)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
