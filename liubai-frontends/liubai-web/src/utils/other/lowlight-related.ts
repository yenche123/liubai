import { lowlight } from 'lowlight'

// 整个 App 周期，调用一次即可
export function initLowlight() {

  if(!lowlight.registered("Plain Text")) {
    lowlight.registerAlias({ plaintext: ["Plain Text"] })
  }

}

export function getSupportedLanguages() {
  const UP_LIST = ["css", "xml", "sql", "yaml", "php", "json"]
  const NO_CHANGE = ["cpp", "scss", "less", "php-template"]
  const tmpList = lowlight.listLanguages()
  let list: string[] = []

  tmpList.forEach(v => {
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
    else {
      v2 = v[0].toUpperCase() + v.substring(1)
    }

    let supported = lowlight.registered(v2)
    if(!supported) {
      v2 = v
    }

    list.push(v2)
  })

  return list
}