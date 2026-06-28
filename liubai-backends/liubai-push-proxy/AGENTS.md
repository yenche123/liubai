# liubai-push-proxy (Cloudflare Worker)

这是一个为 Liubai 后端设计的 Web Push 代理服务。

本文件是该目录的 harness 文件，用于协助 AI 和自动化工具理解、检查、构建和验证代码。仓库级约定见根目录 `AGENTS.md`；本目录仍然使用 Bun，运行脚本时优先使用 `bun run ...`，临时执行 CLI 时使用 `bunx ...`。

---

# Cloudflare Workers API Documentation

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page. eg. `/workers/platform/limits`

## Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Local development |
| `bun run deploy` | Deploy to Cloudflare |
| `bun run cf-typegen` | Generate TypeScript types |
| `bunx wrangler <command>` | Run one-off Wrangler commands when no package script exists |

Run `bun run cf-typegen` after changing bindings in wrangler.jsonc.

## Node.js Compatibility

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`
