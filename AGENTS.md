# Liubai Harness

本仓库中的大写 `.md` 文件统称为 harness 文件，用来协助 AI 和自动化工具理解、检查、构建和验证代码。更新代码时优先遵守离目标文件最近的 harness 文件；若子目录没有更具体的 harness，则遵守本文件。

## Package Manager

本项目使用 Bun。处理 JavaScript / TypeScript 依赖、脚本、构建和本地服务时，默认使用 `bun` / `bunx`，不要用 `pnpm`、`npm` 或 `npx` 生成锁文件或安装依赖。

- 根目录依赖：`bun install`
- Web 前端：`cd liubai-frontends/liubai-web && bun run dev`
- Web 构建：`cd liubai-frontends/liubai-web && bun run build`
- 文档站：`cd liubai-docs && bun run docs:dev`
- Cloudflare Worker 子项目：`cd liubai-backends/liubai-push-proxy && bun run dev`

如果因为外部文档示例需要使用 `npx`，先转换为等价的 `bunx` 或已有 `bun run` 脚本。

## Working Rules

- 不要提交或保留 `pnpm-lock.yaml`、`package-lock.json`、`yarn.lock` 等非 Bun 锁文件。
- 修改前端后，用 Bun 运行对应验证命令；需要本地预览时也用 Bun 启动开发服务器。
- 不要覆盖用户已有的未提交改动；只改当前任务需要的文件。
- 读取大文件或搜索代码时优先使用 `rg` / `rg --files`。

## Wire Protocol 兼容规则（前后端接口）

前端通过 sync-get 等接口发给后端的枚举值（如 `liubai-backends/liubai-laf/cloud-functions/common-types.ts`
里的 `threadListViewTypes`）是 wire protocol，后端 schema 用严格 picklist 校验。修改时必须遵守：

- **后端枚举值只能加、不能直接删或改名。** 线上已发布的旧前端（PWA 缓存、微信 webview 里未刷新的页面）
  会继续发送旧值，后端删掉后这些请求会被 schema 拒绝（`E4000`）。
- **前端不再消费某个值时，只清理前端代码；后端保留该值及其处理分支，并标注 `[legacy]` 注释**
  （保留原因 + 勿删提示），等旧客户端自然淘汰后（至少间隔一个大版本）再从后端移除。
- **改名的正确路径**：后端先同时接受新旧两个值 → 前端切换到新值发布 → 观察旧值流量归零后再删旧值。
- 现存案例：`TODAY_FUTURE`（旧日程页视图，前端已于 v0.34 移除，后端保留中）。
