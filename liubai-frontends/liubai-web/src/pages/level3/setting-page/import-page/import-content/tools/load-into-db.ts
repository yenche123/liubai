
import cui from "~/components/custom-ui"
import type { ImportedAtom2 } from "./types"
import type { ContentLocalTable } from "~/types/types-table"
import { db } from "~/utils/db"
import liuUtil from "~/utils/liu-util"

export async function loadIntoDB(list: ImportedAtom2[]) {
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

  const res = await cui.showModal({ title_key: "import.i2", content_key: "import.i3" })
  if(!res.confirm) return false

  cui.showLoading({ title_key: "import.importing" })

  if(newList.length > 0) {
    console.log("去批量添加动态............")
    const addRes = await putToDB(newList)
    if(!addRes) {
      cui.hideLoading()
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
      cui.hideLoading()
      await cui.showModal({ 
        title_key: "tip.tip", 
        content_key: "import.i5", 
        showCancel: false 
      })
      return false
    }
  }

  
  cui.hideLoading()
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