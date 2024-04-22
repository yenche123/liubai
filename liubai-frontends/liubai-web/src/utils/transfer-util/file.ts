import type { LiuImageStore, LiuFileStore } from "~/types";
import type { Cloud_ImageStore, Cloud_FileStore } from "~/types/types-cloud"


export function imagesFromStoreToCloud(
  local_list?: LiuImageStore[]
) {
  if(!local_list) return

  let cloud_list: Cloud_ImageStore[] = []
  for(let i=0; i<local_list.length; i++) {
    const v = local_list[i]
    if(!v.cloud_url) continue
    const obj: Cloud_ImageStore = {
      id: v.id,
      name: v.name,
      lastModified: v.lastModified,
      mimeType: v.mimeType,
      width: v.width,
      height: v.height,
      h2w: v.h2w,
      url: v.cloud_url,
      url_2: v.cloud_url_2,
      blurhash: v.blurhash,
      someExif: v.someExif,
    }
    cloud_list.push(obj)
  }
  return cloud_list
}

export function filesFromStoreToCloud(
  local_list?: LiuFileStore[]
) {
  if(!local_list) return

  let cloud_list: Cloud_FileStore[] = []
  for(let i=0; i<local_list.length; i++) {
    const v = local_list[i]
    if(!v.cloud_url) continue
    const obj: Cloud_FileStore = {
      id: v.id,
      name: v.name,
      lastModified: v.lastModified,
      suffix: v.suffix,
      size: v.size,
      mimeType: v.mimeType,
      url: v.cloud_url,
    }
    cloud_list.push(obj)
  }
  return cloud_list
}