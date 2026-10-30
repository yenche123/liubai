import { commonSymbols, groups } from "virtual:liu-svg-icons"

const pending = new Map<string, Promise<void>>()
const loaded = new Set<string>()
const SPRITE_ID = "__svg__icons__dom__"

function insertSymbols(symbols: string) {
  let sprite = document.querySelector<SVGSVGElement>(`#${SPRITE_ID}`)
  if (!sprite) {
    sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    sprite.id = SPRITE_ID
    sprite.setAttribute("aria-hidden", "true")
    sprite.setAttribute("width", "0")
    sprite.setAttribute("height", "0")
    sprite.style.position = "absolute"
    document.body.appendChild(sprite)
  }
  sprite.insertAdjacentHTML("beforeend", symbols)
}

// Available synchronously before the first SvgIcon renders.
insertSymbols(commonSymbols)

export function loadSvgIcon(name: string, prefix = "icon"): Promise<void> {
  if (prefix !== "icon" || document.getElementById(`${prefix}-${name}`)) return Promise.resolve()
  const group = Object.keys(groups).find(key => name.startsWith(`${key}-`)) ?? "other"
  if (loaded.has(group)) return Promise.resolve()
  const existing = pending.get(group)
  if (existing) return existing
  const loader = groups[group]
  if (!loader) return Promise.resolve()
  const promise = loader().then(symbols => {
    insertSymbols(symbols)
    loaded.add(group)
  }).finally(() => pending.delete(group))
  pending.set(group, promise)
  return promise
}
