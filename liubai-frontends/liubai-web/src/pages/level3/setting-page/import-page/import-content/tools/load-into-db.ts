
import cui from "~/components/custom-ui"
import type { ImportedAtom2 } from "./types"
import type { ContentLocalTable } from "~/types/types-table"
import { db } from "~/utils/db"
import liuUtil from "~/utils/liu-util"
import transferUtil from "~/utils/transfer-util"
import valTool from "~/utils/basic/val-tool"

export async function loadIntoDB(list: ImportedAtom2[]) {


  cui.showLoading({ title_key: "import.importing" })

  await valTool.waitMilli(10)

  cui.hideLoading()

  await cui.showModal({
    title_key: "import.well_done",
    content_key: "import.imported",
    showCancel: false,
    confirm_key: "common.back"
  })

  return true


  const newList: ContentLocalTable[] = []
  const updatedList: ContentLocalTable[] = []
  list.forEach(v => {
    const s = v.status
    const data = liuUtil.toRawData(v.threadData)
    if(s === "new") newList.push(data)
    else if(s === "update_required") updatedList.push(data)
  })

  if(!newList.length && !updatedList.length) {
    await cui.showModal({ 
      title_key: "import.good_news", 
      content_key: "import.i1",
      showCancel: false,
    })
    return true
  }

  const res = await cui.showModal({ 
    title_key: "import.i2", 
    content_key: "import.i3",
    content_opt: { newNum: newList.length, updateNum: updatedList.length }
  })
  if(!res.confirm) return false

  cui.showLoading({ title_key: "import.importing" })

  if(newList.length > 0) {
    console.log("去批量添加动态............")
    const addRes = await putToDB(newList)
    if(!addRes) {
      await cui.hideLoading()
      await cui.showModal({ 
        title_key: "tip.tip", 
        content_key: "import.i4", 
        showCancel: false 
      })
      return false
    }
  }

  if(updatedList.length > 0) {
    console.log("去批量更新动态............")
    const uRes = await putToDB(updatedList)
    if(!uRes) {
      await cui.hideLoading()
      await cui.showModal({ 
        title_key: "tip.tip", 
        content_key: "import.i5", 
        showCancel: false 
      })
      return false
    }
  }

  
  await cui.hideLoading()
  await cui.showModal({
    title_key: "import.well_done",
    content_key: "import.imported",
    showCancel: false,
    confirm_key: "common.back"
  })
  
  return true
}

async function putToDB(
  list: ContentLocalTable[]
) {

  // 组装 search_title / search_other
  list = list.map(v => {
    const search_title = (v.title ?? "").toLocaleLowerCase()
    const search_other = (transferUtil.tiptapToText(v.liuDesc ?? [])).toLowerCase()
    v.search_title = search_title
    v.search_other = search_other
    return v
  })


  try {
    const res = await db.contents.bulkPut(list)
    console.log("看一下 putToDB res: ")
    console.log(res)
  }
  catch(err) {
    console.error("putToDB error::")
    console.log(err)
    console.log(" ")
    return false
  }

  return true
}