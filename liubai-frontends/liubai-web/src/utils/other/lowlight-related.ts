import { lowlight } from 'lowlight'

// 整个 App 周期，调用一次即可
export function initLowlight() {

  if(!lowlight.registered("Plain Text")) {
    lowlight.registerAlias({ plaintext: ["Plain Text"] })
  }
  if(!lowlight.registered("Objective-C")) {
    lowlight.registerAlias({ objectivec: ["Objective-C"] })
  }

}

export function showProgrammingLanguages() {
  const tmpList = lowlight.listLanguages()
  let list: string[] = []

  tmpList.forEach(v => {
    let v2 = supportedToShow(v)
    list.push(v2)
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

  if(!lowlight.registered(v2)) {
    return null
  }

  return v2
}


const UP_LIST = ["css", "xml", "sql", "yaml", "php", "json"]
const NO_CHANGE = ["cpp", "scss", "less", "php-template"]

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

  let supported = lowlight.registered(v2)
  if(!supported) {
    console.warn("找到一个不支持的语言: ")
    console.log(v)
    console.log(v2)
    v2 = v
  }

  return v2
}