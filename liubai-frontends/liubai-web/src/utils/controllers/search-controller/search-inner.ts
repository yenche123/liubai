import type { ContentLocalTable } from "~/types/types-table"
import { db } from "~/utils/db"
import valTool from "~/utils/basic/val-tool";
import type {
  SearchOpt,
} from "./types"
import { getSpaceId, resToAtoms } from "./util";


// title 的加权 22
// desc 里的加权 10

interface ScoreAndContent {
  score: number
  data: ContentLocalTable
}

export async function searchInner(param: SearchOpt) {
  const { text, excludeThreads = [], mode } = param
  if(!text) return []

  let spaceId = getSpaceId()
  
  const texts = text.split(" ").filter(v => Boolean(v))
  const regexs = texts.map(v => {
    if(v.length >= 4) {
      return new RegExp(v, "gi")
    }
    const isEng = valTool.isAllEnglishChar(v)
    if(isEng) {
      return new RegExp("\\b" + v + "", "gi")
    }
    return new RegExp(v, "g")
  })

  const onlyThread = mode === "select_thread"

  let list: ScoreAndContent[] = []
  const filterFunc = (item: ContentLocalTable) => {
    if(item.oState !== "OK") return false
    if(spaceId !== item.spaceId) return false
    if(onlyThread && item.infoType !== "THREAD") return false
    if(excludeThreads.includes(item._id)) return false
    const { search_title = "", search_other = "" } = item
    if(!search_title && !search_other) return false

    let score = 0
    for(let i=0; i<regexs.length; i++) {
      const reg = regexs[i]
      const matches1 = search_title.matchAll(reg)
      const count1 = Array.from(matches1).length
      const matches2 = search_other.matchAll(reg)
      const count2 = Array.from(matches2).length
      if(!count1 && !count2) return false

      let count3 = 0  // Check if in first 3 lines
      let count4 = 0  // Check if in first line
      let count5 = 0  // Check if in first line and in first 30 chars
      if(count2) {
        let lines = search_other.split("\n")
        if(lines.length > 3) {
          lines.splice(3, lines.length - 3)
        }
        const matches3 = lines.join("\n").matchAll(reg)
        count3 = Array.from(matches3).length
        if(count3) {
          const firstLine = lines[0]
          const matches4 = firstLine.matchAll(reg)
          count4 = Array.from(matches4).length
          if(count4) {
            const matches5 = firstLine.substring(0, 30).matchAll(reg)
            count5 = Array.from(matches5).length
          }
        }
      }
      
      score = score + (count1 * 22) + (count2 * 10) + (count3 * 7)
      score = score + (count4 * 7) + (count5 * 17)
    }

    list.push({ score, data: item })
    return true
  }

  let tmp = db.contents.orderBy("editedStamp").filter(filterFunc)
  tmp = tmp.reverse().limit(10)
  let res = await tmp.toArray()

  list.sort((a, b) => {
    if(a.score > b.score) return -1
    if(a.score < b.score) return 1
    const aData = a.data
    const bData = b.data
    if(aData.editedStamp < bData.editedStamp) return 1
    return -1
  })

  // console.log("searchInner 看一下 list: ")
  // console.log(list)

  const list2 = list.map(v => v.data)
  const list3 = resToAtoms("inner", list2, text)
  return list3
}