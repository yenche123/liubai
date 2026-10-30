import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { reserveInputFocus } from "./input-focus"

class Input extends EventTarget {
  value = ""
  tabIndex = 0
  style = { cssText: "" }
  className = ""
  removed = false
  setAttribute() {}
  matches(selector: string): boolean { return selector === ".editor" }
  focus() {
    const event = new Event("focusin")
    Object.defineProperty(event, "target", { value: this })
    doc.dispatchEvent(event)
  }
  remove() { this.removed = true }
}
let doc: EventTarget & { createElement: ReturnType<typeof vi.fn>; body: { appendChild: ReturnType<typeof vi.fn> } }
let release: (() => void) | undefined
beforeEach(() => {
  vi.useFakeTimers()
  doc = Object.assign(new EventTarget(), {
    createElement: vi.fn(() => new Input()), body: { appendChild: vi.fn() },
  })
  vi.stubGlobal("document", doc)
  vi.stubGlobal("HTMLInputElement", Input)
  vi.stubGlobal("navigator", { userAgent: "iPhone", platform: "iPhone", userActivation: { isActive: true } })
})
afterEach(() => {
  release?.()
  release = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("input focus across a lazy editor load", () => {
  it("focuses during the gesture and transfers early typing to the real editor after loading", async () => {
    release = reserveInputFocus(".editor")
    const temporary = doc.createElement.mock.results[0].value as Input
    expect(doc.body.appendChild).toHaveBeenCalledWith(temporary)
    temporary.value = "typed while loading"
    await Promise.resolve()
    const editor = new Input()
    const onInput = vi.fn()
    editor.addEventListener("input", onInput)
    editor.focus()
    expect(editor.value).toBe("typed while loading")
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(temporary.removed).toBe(true)
  })

  it("does not reserve focus for URL-driven opens without a user gesture", () => {
    vi.stubGlobal("navigator", { userAgent: "iPhone", platform: "iPhone", userActivation: { isActive: false } })
    release = reserveInputFocus(".editor")
    expect(doc.body.appendChild).not.toHaveBeenCalled()
  })

  it("never forwards early typing into an unrelated input", () => {
    release = reserveInputFocus(".editor")
    const temporary = doc.createElement.mock.results[0].value as Input
    temporary.value = "early typing"
    const other = new Input()
    other.matches = () => false
    other.focus()
    expect(other.value).toBe("")
    expect(temporary.removed).toBe(true)
  })

  it("releases the temporary input if loading fails", () => {
    release = reserveInputFocus(".editor")
    const temporary = doc.createElement.mock.results[0].value as Input
    release()
    expect(temporary.removed).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
})
