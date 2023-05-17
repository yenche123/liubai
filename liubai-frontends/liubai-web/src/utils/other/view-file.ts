// [查看文件] 的具体操作
import type { LiuFileStore } from "~/types"
import imgHelper from "../files/img-helper"
import cui from "~/components/custom-ui"
import fileHelper from "../files/file-helper"
import liuUtil from "../liu-util"

// 给定一个文件，若是
//   图片: 直接用 preview-image 显示
//   其他: 开启新的窗口显示
export async function viewFile(store: LiuFileStore) {

  const mimeType = store.mimeType.toLowerCase()

  // 图片
  if(mimeType.indexOf("image") === 0) {
    const f = fileHelper.storeToFile(store)
    if(!f) return
    const [imgStore] = await imgHelper.getMetaDataFromFiles([f])
    const imgShow = imgHelper.imageStoreToShow(imgStore)
    await cui.previewImage({ imgs: [imgShow] })

    // 回收资源
    liuUtil.recycleURL(imgShow.id, imgShow.src)
    return true
  }

  // 其他，都用新的窗口打开
  const [url] = liuUtil.createURLsFromStore([store])
  if(!url) return
  window.open(url, "_blank")
  return true
}