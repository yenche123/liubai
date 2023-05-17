// [查看文件] 的具体操作
import type { LiuFileStore } from "~/types"
import imgHelper from "../files/img-helper"
import cui from "~/components/custom-ui"

// 给定一个文件，若是
//   图片: 直接用 preview-image 显示
//   音频: 开启新的窗口显示
//   pdf: 开启新的窗口显示
//   视频: 开启新的窗口显示
//   其他: 下载下来
export async function viewFile(file: LiuFileStore) {

  const mimeType = file.mimeType.toLowerCase()

  // 图片
  if(mimeType.indexOf("image") === 0) {
    // const [imgStore] = await imgHelper.getMetaDataFromFiles([file])
    // const imgShow = imgHelper.imageStoreToShow(file)
    // cui.previewImage({ imgs: [imgShow] })
    return true
  }

  // 
  

}