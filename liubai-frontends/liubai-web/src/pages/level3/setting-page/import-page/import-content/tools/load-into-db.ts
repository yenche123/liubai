
import cui from "~/components/custom-ui"
import type { ImportedAtom2 } from "./types"
import type { ContentLocalTable } from "~/types/types-table"

export async function loadIntoDB(list: ImportedAtom2[]) {
  const newList: ContentLocalTable[] = []
  const updatedList: ContentLocalTable[] = []
  list.forEach(v => {
    const s = v.status
    if(s === "new") newList.push(v.threadData)
    else if(s === "update_required") updatedList.push(v.threadData)
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
  

}