import type { LiuFileStore } from "~/types"

function storeToFile(store: LiuFileStore) {
  const { arrayBuffer, name, mimeType, lastModified } = store
  if(!arrayBuffer) {
    console.warn("没有 arrayBuffer.........")
    return
  }

  const f = new File([arrayBuffer], name, { type: mimeType, lastModified })
  return f
}

export default {
  storeToFile,
}