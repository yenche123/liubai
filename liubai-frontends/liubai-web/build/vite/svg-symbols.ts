import { readdir } from "node:fs/promises"
import { relative, resolve } from "node:path"
import type { Plugin } from "vite"
import { compilerIcon, createSymbolId } from "vite-plugin-svg-icons"

const PUBLIC_ID = "virtual:liu-svg-icons"
const GROUP_PREFIX = "virtual:liu-svg-group/"
// Navigation and thread-card icons should render without another network request.
const COMMON_ICONS = new Set([
  "add", "search", "home", "home_selected", "mine", "mine_selected",
  "star", "star_selected", "collected", "tag", "priority", "priority_selected",
  "priority_400", "schedule", "schedule_selected", "hub", "notification", "more",
  "setting", "delete_400", "triangle_open", "arrow-right", "arrow-right2",
  "arrow-back700", "close", "double_arrow_up", "emoji", "comment", "share",
  "when", "hourglass_empty", "attachment", "cloud_off", "no_ai", "menu",
  "title", "lock", "arrow-back", "open_in_new",
  "editor-image", "editor-open_fullscreen", "editor-format_clear",
])

export function svgSymbols(projectRoot: string): Plugin {
  const iconRoot = resolve(projectRoot, "src/assets/icons")
  async function getGroups() {
    const groups = new Map<string, string[]>()
    async function visit(dir: string) {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const file = resolve(dir, entry.name)
        if (entry.isDirectory()) await visit(file)
        else if (entry.name.endsWith(".svg")) {
          const name = relative(iconRoot, file).replaceAll("\\", "/")
          const iconName = name.slice(0, -4).replaceAll("/", "-")
          const group = COMMON_ICONS.has(iconName) ? "common"
            : name.includes("/") ? name.split("/")[0] : "other"
          groups.set(group, [...(groups.get(group) ?? []), file])
        }
      }
    }
    await visit(iconRoot)
    return groups
  }
  return {
    name: "liubai-svg-symbols",
    enforce: "pre",
    resolveId(id) {
      if (id === PUBLIC_ID || id.startsWith(GROUP_PREFIX)) return `\0${id}`
    },
    async load(id) {
      if (id !== `\0${PUBLIC_ID}` && !id.startsWith(`\0${GROUP_PREFIX}`)) return
      const groups = await getGroups()
      if (id === `\0${PUBLIC_ID}`) {
        const loaders = [...groups.keys()].filter(g => g !== "common")
          .map(g => `${JSON.stringify(g)}: () => import(${JSON.stringify(GROUP_PREFIX + g)}).then(m => m.default)`)
        return `export { default as commonSymbols } from ${JSON.stringify(GROUP_PREFIX + "common")};\nexport const groups = {${loaders.join(",")}};`
      }
      const files = groups.get(id.slice(`\0${GROUP_PREFIX}`.length)) ?? []
      const symbols = await Promise.all(files.sort().map(async file => {
        this.addWatchFile(file)
        const name = relative(iconRoot, file).replaceAll("\\", "/")
        const symbolId = createSymbolId(name, { iconDirs: [iconRoot], symbolId: "icon-[dir]-[name]" })
        // Match the original sprite plugin's svgoOptions:false behavior.
        // The package accepts false at runtime but omits it from this export's type.
        return await compilerIcon(file, symbolId, false as unknown as Parameters<typeof compilerIcon>[2]) ?? ""
      }))
      return `export default ${JSON.stringify(symbols.join(""))}`
    },
    handleHotUpdate(ctx) {
      if (!ctx.file.startsWith(iconRoot) || !ctx.file.endsWith(".svg")) return
      // A reload avoids stale symbols in the DOM after an icon changes.
      for (const mod of ctx.server.moduleGraph.idToModuleMap.values()) {
        if (mod.id?.startsWith(`\0${PUBLIC_ID}`) || mod.id?.startsWith(`\0${GROUP_PREFIX}`)) {
          ctx.server.moduleGraph.invalidateModule(mod)
        }
      }
      ctx.server.ws.send({ type: "full-reload" })
      return []
    },
  }
}
