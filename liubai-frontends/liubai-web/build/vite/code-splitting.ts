function normalizeModuleId(id: string) {
  return id.replace(/[\\]/g, "/")
}

function normalizePackageName(name: string) {
  return name
    .replace(/^@/, "")
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
}

function getPackageName(id: string) {
  const normalizedId = normalizeModuleId(id)
  const parts = normalizedId.split("node_modules/")
  const modulePath = parts.at(-1)
  if (!modulePath) return null

  const segments = modulePath.split("/")
  const first = segments[0]
  if (!first) return null

  if (first.startsWith("@")) {
    const second = segments[1]
    if (!second) return null
    return `${first}/${second}`
  }

  return first
}

const vendorChunkRules: { packages: string[]; scopes?: string[]; chunk: string }[] = [
  { packages: ["vue", "vue-router", "pinia"], scopes: ["@vue"], chunk: "vue-core" },
  { packages: ["vue-i18n"], scopes: ["@intlify"], chunk: "vue-i18n" },
  { packages: ["floating-vue"], scopes: ["@floating-ui"], chunk: "ui-vendor" },
  { packages: ["dexie", "flexsearch"], chunk: "search-vendor" },
]

export function getVendorChunkName(moduleId: string) {
  const id = normalizeModuleId(moduleId)
  if (!id.includes("node_modules/")) return null
  const packageName = getPackageName(id)
  if (!packageName) return "vendor"

  if (packageName === "highlight.js" && id.includes("/languages/")) {
    return "vendor-highlight-langs"
  }
  if (packageName === "lowlight" && (id.includes("/lib/common") || id.includes("/lib/all"))) {
    return "vendor-highlight-langs"
  }

  for (const rule of vendorChunkRules) {
    if (rule.packages.includes(packageName) || rule.scopes?.includes(packageName.split("/")[0])) {
      return rule.chunk
    }
  }

  return `vendor-${normalizePackageName(packageName)}`
}

export const vendorCodeSplitting = {
  // A lazy vendor must not absorb shared dependencies used by the entry chunk.
  includeDependenciesRecursively: false,
  groups: [
    {
      test: "node_modules",
      minSize: 12 * 1024,  // 12 KB
      name: getVendorChunkName,
    },
  ],
}
