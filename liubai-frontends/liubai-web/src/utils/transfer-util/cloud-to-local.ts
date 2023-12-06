import type { Cloud_ImageStore, Cloud_FileStore } from "~/types/types-cloud";
import type { FileShow, ImageShow } from "~/types";


/** 将云端的图片格式，转为本地可显示的格式 */
export function imageFromCloudToShow(c1?: Cloud_ImageStore) {
  if(!c1) return undefined
  
  const c2: ImageShow = {
    src: c1.url,
    id: c1.id,
    width: c1.width,
    height: c1.height,
    h2w: c1.h2w,
    blurhash: c1.blurhash,
  }
  return c2

}

/** 将云端的文件格式，转为本地可显示的格式 */
export function fileFromCloudToShow(f1?: Cloud_FileStore) {
  if(!f1) return undefined

  const f2: FileShow = {
    id: f1.id,
    name: f1.name,
    suffix: f1.suffix,
    size: f1.size,
    cloud_url: f1.url,
  }
  return f2
}