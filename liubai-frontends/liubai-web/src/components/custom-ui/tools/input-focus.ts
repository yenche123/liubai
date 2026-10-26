let releaseCurrent: (() => void) | undefined

// Keep the iOS keyboard active while a first-use editor downloads and mounts.
// Focusing only after import() loses the original user gesture on WebKit.
export function reserveInputFocus(selector: string): () => void {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  if (!ios || !navigator.userActivation?.isActive) return () => {}
  releaseCurrent?.()
  const input = document.createElement("input")
  input.tabIndex = -1
  input.setAttribute("aria-label", "输入")
  input.className = "ph-no-capture"
  input.setAttribute("data-clarity-mask", "true")
  input.setAttribute("data-bf-ignore-keypress", "")
  input.setAttribute("data-openreplay-obscured", "")
  input.style.cssText = "position:fixed;top:50%;left:50%;width:1px;height:1px;opacity:0.01;font-size:16px;pointer-events:none;"
  document.body.appendChild(input)
  input.focus({ preventScroll: true })
  // Preserve anything typed while the editor is loading.
  const forwardInput = (event: FocusEvent) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement) || target === input) return
    if (!target.matches(selector)) {
      release()
      return
    }
    if (input.value) {
      target.value = input.value
      target.dispatchEvent(new Event("input", { bubbles: true }))
    }
    release()
  }
  const release = () => {
    clearTimeout(timeout)
    document.removeEventListener("focusin", forwardInput)
    input.remove()
    if (releaseCurrent === release) releaseCurrent = undefined
  }
  const timeout = setTimeout(release, 15000)
  document.addEventListener("focusin", forwardInput)
  releaseCurrent = release
  return release
}
