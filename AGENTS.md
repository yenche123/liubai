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
