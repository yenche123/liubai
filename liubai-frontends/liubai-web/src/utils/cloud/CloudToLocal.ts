import type { Cloud_ImageStore, Cloud_FileStore } from "~/types/types-cloud";
import type { 
  LiuImageStore,
  LiuFileStore,
  FileShow, 
  ImageShow,
} from "~/types";


interface ImageTransferedRes {
  useCloud: boolean
  image?: LiuImageStore
}

interface FileTransferedRes {
  useCloud: boolean
  file?: LiuFileStore
}


class CloudToLocal {

  static isOnline: boolean | undefined

  // 放在 App.ts 中去监听网络变化
  static init() {
    
  }
  

  /** 判断云端图片如何快速转换成本地存储格式 
   * 注意: 该方法不会真的将云端图片存成 arrayBuffer 格式
  */
  static imageFromCloudToStore(
    cloudImage?: Cloud_ImageStore,
    localImage?: LiuImageStore,
  ): ImageTransferedRes {
    if(!cloudImage) return { useCloud: false }

    // 如果本地图片存在，并且 id 一致，使用本地的
    if(localImage) {
      if(localImage.id === cloudImage.id) {
        return { useCloud: false, image: localImage }
      }
    }

    // 否则，一律使用云端的
    const newImage: LiuImageStore = {
      id: cloudImage.id,
      name: cloudImage.name,
      lastModified: cloudImage.lastModified,
      mimeType: cloudImage.mimeType ?? "",
      width: cloudImage.width,
      height: cloudImage.height,
      h2w: cloudImage.h2w,
      cloud_url: cloudImage.url,
      cloud_url_2: cloudImage.url_2,
      blurhash: cloudImage.blurhash,
      someExif: cloudImage.someExif,
    }
    return { useCloud: true, image: newImage }
  }

  /** 判断云端文件如何快速转换成本地存储格式 
   * 注意: 该方法不会真的将云端文件存成 arrayBuffer 格式
  */
  static fileFromCloudToStore(
    cloudFile?: Cloud_FileStore,
    localFile?: LiuFileStore,
  ): FileTransferedRes {
    if(!cloudFile) return { useCloud: false }

    // 如果本地文件存在，并且 id 一致，使用本地的
    if(localFile) {
      if(localFile.id === cloudFile.id) {
        return { useCloud: false, file: localFile }
      }
    }

    const newFile: LiuFileStore = {
      id: cloudFile.id,
      name: cloudFile.name,
      lastModified: cloudFile.lastModified,
      suffix: cloudFile.suffix,
      size: cloudFile.size,
      mimeType: cloudFile.mimeType,
      cloud_url: cloudFile.url,
    }
    return { useCloud: true, file: newFile }
  }

  /** 将云端图片直接转成显示模式，不涉及本地存储 */
  static imageFromCloudToShow(c1?: Cloud_ImageStore) {
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

  /** 将云端文件直接转成显示模式，不涉及本地存储 */
  static fileFromCloudToShow(f1?: Cloud_FileStore) {
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


  
}

export { CloudToLocal }