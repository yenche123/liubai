import { afterEach, describe, expect, it, vi } from "vitest"
import { defineComponent, h, type App } from "vue"
import { createMemoryHistory, createRouter } from "vue-router"
import { defineLazyCustomUi, ensureCustomUi, requestedCustomUi } from "./lazy-custom-ui"
import { useCustomUiRoute } from "./use-custom-ui-route"
import { node, renderer } from "./test-renderer"

let app: App
async function mountAt(url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { render: () => null } }],
  })
  await router.push(url)
  const searchLoaded = vi.fn(async () => ({ default: defineComponent({ render: () => h("search") }) }))
  const panelLoaded = vi.fn(async () => ({ default: defineComponent({ render: () => h("panel") }) }))
  const Search = defineLazyCustomUi("search-editor", searchLoaded)
  const Panel = defineLazyCustomUi("content-panel", panelLoaded)
  app = renderer.createApp({
    setup() {
      useCustomUiRoute()
      return () => [
        requestedCustomUi["search-editor"] ? h(Search) : null,
        requestedCustomUi["content-panel"] ? h(Panel) : null,
      ]
    },
  })
  app.use(router)
  app.mount(node())
  return { router, searchLoaded, panelLoaded }
}

afterEach(() => {
  app?.unmount()
  for (const key of Object.keys(requestedCustomUi)) delete requestedCustomUi[key as keyof typeof requestedCustomUi]
})

describe("lazy popup routes", () => {
  it("removes multiple unrecoverable popup parameters without loading popups or losing business state", async () => {
    const { router, searchLoaded, panelLoaded } = await mountAt("/calendar?contentpanel=01&commentpopup=01&browsecode=01&qrcodepopup=01&cid=abc#today")
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe("/calendar?cid=abc#today"))
    expect(searchLoaded).not.toHaveBeenCalled()
    expect(panelLoaded).not.toHaveBeenCalled()
  })

  it.each(["search=01", "q=keyword", "q="])("mounts search on a direct link with %s", async query => {
    const { router, searchLoaded } = await mountAt(`/calendar?${query}`)
    await ensureCustomUi("search-editor")
    expect(searchLoaded).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe(`/calendar?${query}`)
  })

  it("handles later URL navigation and retains search while cleaning unrelated stale parameters", async () => {
    const { router, searchLoaded } = await mountAt("/calendar")
    expect(searchLoaded).not.toHaveBeenCalled()
    await router.push("/calendar?q=next&htselector=01&cid=abc#anchor")
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe("/calendar?q=next&cid=abc#anchor"))
    await ensureCustomUi("search-editor")
    expect(searchLoaded).toHaveBeenCalledTimes(1)
  })

  it("does not clean a popup being opened through its controller", async () => {
    const { router } = await mountAt("/calendar")
    await ensureCustomUi("content-panel")
    await router.push("/calendar?contentpanel=01")
    expect(router.currentRoute.value.query.contentpanel).toBe("01")
  })
})
