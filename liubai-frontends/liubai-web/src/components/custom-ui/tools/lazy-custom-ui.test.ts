import { defineComponent, h, nextTick, onMounted } from "vue"
import { describe, expect, it, vi } from "vitest"
import { defineLazyCustomUi, ensureCustomUi, requestedCustomUi } from "./lazy-custom-ui"

import { node, renderer } from "./test-renderer"

describe("lazy custom UI", () => {
  it("loads on first request, waits for child setup/mount, and reuses the mounted popup", async () => {
    const events: string[] = []
    const loader = vi.fn(async () => ({
      default: defineComponent({
        setup() {
          events.push("setup")
          onMounted(() => events.push("mounted"))
          return () => h("popup")
        },
      }),
    }))
    const Popup = defineLazyCustomUi("date-picker", loader)
    const app = renderer.createApp({
      render: () => requestedCustomUi["date-picker"] ? h(Popup) : null,
    })
    app.mount(node())
    expect(loader).not.toHaveBeenCalled()

    const first = ensureCustomUi("date-picker")
    const second = ensureCustomUi("date-picker")
    expect(second).toBe(first)
    first.then(() => events.push("open"))
    await first
    expect(events).toEqual(["setup", "mounted", "open"])
    expect(loader).toHaveBeenCalledTimes(1)

    await ensureCustomUi("date-picker")
    expect(loader).toHaveBeenCalledTimes(1)
    app.unmount()
    delete requestedCustomUi["date-picker"]
  })

  it("rejects failed loads and allows a later request to retry", async () => {
    const failure = new Error("offline")
    const loader = vi.fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValue({ default: defineComponent({ render: () => h("popup") }) })
    const Popup = defineLazyCustomUi("bind-popup", loader)
    const app = renderer.createApp({
      render: () => requestedCustomUi["bind-popup"] ? h(Popup) : null,
    })
    app.config.errorHandler = () => {}
    app.mount(node())
    await expect(ensureCustomUi("bind-popup")).rejects.toBe(failure)
    await nextTick()
    expect(requestedCustomUi["bind-popup"]).toBe(false)

    await ensureCustomUi("bind-popup")
    expect(loader).toHaveBeenCalledTimes(2)
    app.unmount()
    delete requestedCustomUi["bind-popup"]
  })
})
