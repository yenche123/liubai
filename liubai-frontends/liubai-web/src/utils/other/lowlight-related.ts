import { createLowlight } from 'lowlight'
import { ref } from 'vue'

type LowlightType = ReturnType<typeof createLowlight>
let gLowlight: LowlightType | null = null
let gLoadPromise: Promise<boolean> | null = null
export const lowlightReady = ref(false)

export function initLowlight() {
  if(gLowlight) {
    return { lowlight: gLowlight }
  }
  const lowlight = createLowlight()
  gLowlight = lowlight
  return { lowlight }
}

export function ensureLowlightLanguages(): Promise<boolean> {
  if (lowlightReady.value) {
    return Promise.resolve(false)
  }
  if (gLoadPromise) {
    return gLoadPromise
  }
  const { lowlight } = initLowlight()
  gLoadPromise = import('./lowlight-grammars').then(({ lowlightGrammars }) => {
    lowlight.register(lowlightGrammars)
    if(!lowlight.registered("Plain Text")) {
      lowlight.registerAlias({ plaintext: ["Plain Text"] })
    }
    if(!lowlight.registered("Objective-C")) {
      lowlight.registerAlias({ objectivec: ["Objective-C"] })
    }
    lowlightReady.value = true
    return true
  }).catch((err) => {
    console.warn("Failed to load highlight.js languages:", err)
    gLoadPromise = null
    return false
  })
  return gLoadPromise
}

export function showProgrammingLanguages() {
  void ensureLowlightLanguages()
  if (!lowlightReady.value) {
    return []
  }
  const { lowlight } = initLowlight()
  const tmpList = lowlight.listLanguages()
  const list: string[] = []

  tmpList.forEach(v => {
    const v2 = supportedToShow(v)
    list.push(v2)
  })

  // add HTML
  const HTML = "HTML"
  const hasHTML = list.includes(HTML)
  if(!hasHTML) {
    list.push(HTML)
  }

  // sort
  list.sort((a, b) => {
    const a2 = a.toLowerCase()
    const b2 = b.toLowerCase()
    if(a2 > b2) return 1
    if(a2 < b2) return -1
    return 0
  })

  return list
}

// 将 "展示的语言" 转为解析时的语言（通常是小写的）
export function showToSupported(v: string | null) {
  if(!v) {
    return null
  }

  let v2 = ""
  if(v === "Objective-C") {
    v2 = "objectivec"
  }
  else if(v === "Plain Text") {
    v2 = "plaintext"
  }
  else {
    v2 = v.toLowerCase()
  }

  void ensureLowlightLanguages()
  if (!lowlightReady.value) {
    return v2
  }

  const { lowlight } = initLowlight()
  if(!lowlight.registered(v2)) {
    console.warn("showToSupported 发现一个语言没有被注册...........")
    console.log(v2)
    console.log(" ")
    return null
  }

  return v2
}


const UP_LIST = ["css", "xml", "html", "sql", "yaml", "php", "json", "wasm"]
const NO_CHANGE = ["cpp", "scss", "less", "php-template", "ini"]

// 将 "解析时的语言" 转为 "展示语言"
export function supportedToShow(v: string | null) {
  if(!v) {
    return ""
  }

  let v2 = ""

  if(NO_CHANGE.includes(v)) {
    v2 = v
  }
  else if(UP_LIST.includes(v)) {
    v2 = v.toUpperCase()
  }
  else if(v === "javascript") {
    v2 = "JavaScript"
  }
  else if(v === "typescript") {
    v2 = "TypeScript"
  }
  else if(v === "plaintext") {
    v2 = "Plain Text"
  }
  else if(v === "graphql") {
    v2 = "GraphQL"
  }
  else if(v === "objectivec") {
    v2 = "Objective-C"
  }
  else {
    v2 = v[0].toUpperCase() + v.substring(1)
  }

  void ensureLowlightLanguages()
  if (!lowlightReady.value) {
    return v2
  }

  const { lowlight } = initLowlight()
  const supported = lowlight.registered(v2)
  if(!supported) {
    console.warn("找到一个不支持的语言: ")
    console.log(v)
    console.log(v2)
    v2 = v
  }

  return v2
}