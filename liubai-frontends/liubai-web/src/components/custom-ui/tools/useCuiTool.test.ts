import { afterEach, describe, expect, it, vi } from "vitest"
import { handleCustomUiQueryErr } from "./useCuiTool"
import type { RouteAndLiuRouter } from "~/routes/liu-router"

function context() {
  const replace = vi.fn().mockResolvedValue(undefined)
  const rr = {
    route: { fullPath: "/?browsecode=01&cid=abc#anchor", path: "/", query: { browsecode: "01", cid: "abc" }, hash: "#anchor" },
    router: { replace },
  }
  return { rr: rr as unknown as RouteAndLiuRouter, replace }
}
afterEach(() => vi.useRealTimers())

describe("stale popup cleanup", () => {
  it("does not close a valid popup opened while an earlier cleanup was waiting", async () => {
    vi.useFakeTimers()
    const { rr, replace } = context()
    let invalid = true
    const done = handleCustomUiQueryErr(rr, "browsecode", () => invalid)
    invalid = false
    await vi.runAllTimersAsync()
    await done
    expect(replace).not.toHaveBeenCalled()
  })

  it("does not apply an old cleanup after navigation", async () => {
    vi.useFakeTimers()
    const { rr, replace } = context()
    const done = handleCustomUiQueryErr(rr, "browsecode", () => true)
    rr.route.fullPath = "/calendar?browsecode=01"
    await vi.runAllTimersAsync()
    await done
    expect(replace).not.toHaveBeenCalled()
  })

  it("cleans invalid UI without navigating backward or dropping business state", async () => {
    vi.useFakeTimers()
    const { rr, replace } = context()
    const done = handleCustomUiQueryErr(rr, "browsecode", () => true)
    await vi.runAllTimersAsync()
    await done
    expect(replace).toHaveBeenCalledWith({ path: "/", query: { cid: "abc" }, hash: "#anchor" })
  })
})
