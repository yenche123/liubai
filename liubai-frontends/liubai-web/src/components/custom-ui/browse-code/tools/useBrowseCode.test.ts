import { reactive, defineComponent, h } from "vue"
import { afterEach, describe, expect, it, vi } from "vitest"
import { defineLazyCustomUi, requestedCustomUi } from "../../tools/lazy-custom-ui"
import { node, renderer } from "../../tools/test-renderer"

vi.mock("~/config", () => ({ default: { frame_duration: 16 } }))
vi.mock("~/utils/liu-api", () => ({ default: {} }))
vi.mock("../../tools/listen-keyup", () => ({ toListenEscKeyUp: vi.fn(), cancelListenEscKeyUp: vi.fn() }))
vi.mock("~/routes/liu-router", () => ({ useRouteAndLiuRouter: () => routeContext }))
const route = reactive({ query: {} as Record<string, string>, fullPath: "/", path: "/", hash: "" })
const replace = vi.fn()
const routeContext = { route, router: { replace, addNewQueryWithOldQuery: vi.fn(), naviBackUntilNoSpecificQuery: vi.fn() } }
const { browseCode, initBrowseCode } = await import("./useBrowseCode")

afterEach(() => {
  vi.useRealTimers()
  delete requestedCustomUi["browse-code"]
})

describe("first browse-code activation", () => {
  it("validates before loading, and prepares payload before an immediate route watcher mounts", async () => {
    vi.useFakeTimers()
    const loader = vi.fn(async () => ({ default: defineComponent({
      setup() {
        const { bcData, onTapClose } = initBrowseCode()
        expect(bcData.code).toBe("const value = 1")
        return () => h("code", { onClick: onTapClose })
      },
    }) }))
    const Popup = defineLazyCustomUi("browse-code", loader)
    const app = renderer.createApp({ render: () => requestedCustomUi["browse-code"] ? h(Popup) : null })
    app.mount(node())
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    await browseCode({ code: "", language: null })
    expect(loader).not.toHaveBeenCalled()
    warn.mockRestore()
    route.query = { browsecode: "01" }
    route.fullPath = "/?browsecode=01"
    void browseCode({ code: "const value = 1", language: "javascript" })
    await vi.advanceTimersByTimeAsync(250)
    expect(loader).toHaveBeenCalledTimes(1)
    expect(replace).not.toHaveBeenCalled()
    app.unmount()
  })
})
