import { describe, expect, it } from "vitest"
import { getVendorChunkName } from "./code-splitting"

describe("vendor package boundaries", () => {
  it.each([
    ["/app/node_modules/vue/dist/vue.runtime.esm-bundler.js", "vue-core"],
    ["/app/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js", "vue-core"],
    ["/app/node_modules/@intlify/core-base/dist/core-base.mjs", "vue-i18n"],
    ["/app/node_modules/@sentry/vue/build/esm/index.js", "vendor-sentry-vue"],
    ["/app/node_modules/@he-tree/vue/dist/v3/index.mjs", "vendor-he-tree-vue"],
    ["/app/node_modules/highlight.js/lib/core.js", "vendor-highlight-js"],
    ["/app/node_modules/highlight.js/es/languages/javascript.js", "vendor-highlight-langs"],
    ["/app/node_modules/highlight.js/lib/languages/javascript.js", "vendor-highlight-langs"],
    ["/app/node_modules/lowlight/lib/common.js", "vendor-highlight-langs"],
    ["/app/node_modules/.pnpm/@sentry+vue@10/node_modules/@sentry/vue/build/esm/index.js", "vendor-sentry-vue"],
    ["/app/node_modules/vue/node_modules/@sentry/browser/build/index.js", "vendor-sentry-browser"],
    ["C:\\app\\node_modules\\@he-tree\\vue\\dist\\index.js", "vendor-he-tree-vue"],
    ["/app/src/vue/index.ts", null],
  ])("assigns %s to %s", (id, expected) => {
    expect(getVendorChunkName(id)).toBe(expected)
  })
})
