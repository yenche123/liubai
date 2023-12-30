import type { Cloud_ImageStore, Cloud_FileStore } from "~/types/types-cloud";
import type { 
  LiuImageStore,
  LiuFileStore,
  FileShow, 
  ImageShow,
} from "~/types";
import { type LiuTable } from "~/types/types-atom"
import { useNetwork, useDebounceFn } from "~/hooks/useVueUse";
import { reactive, watch } from "vue";
import type { LiuTimeout } from "../basic/type-tool";

interface ImageTransferedRes {
  useCloud: boolean
  image?: LiuImageStore
}

interface FileTransferedRes {
  useCloud: boolean
  file?: LiuFileStore
}


// 下载任务的结构，其中 C2L 为 CloudToLocal 的简称
interface TaskOfC2L {
  table: LiuTable
  id: string
}

type TaskState = "available" | "working"

class CloudToLocal {

  
  static state: TaskState = "available"
  static isOnline: boolean | undefined

  // 暂存任务至临时变量中，当存到 IndexedDB 中后，就删掉
  static tmp_tasks: TaskOfC2L[] = []

  // 放在 App.ts 中去监听网络变化
  static init() {
    let _this = this
    const networkState = useNetwork()
    const networkState2 = reactive(networkState)

    const _checkCurrentState = useDebounceFn(() => {
      if(!_this.isOnline && networkState2.isOnline) {
        _this.triggerDownload()
      }
    }, 500)

    watch(networkState2, (newV) => {
      _checkCurrentState()
    }, { immediate: true })
  }

  /** 触发下载 */
  private static triggerDownload() {
    if(!this.isOnline) return
    if(this.state === "working") return
    
    
  }


  
  private static timeoutOfNotify: LiuTimeout

  /** 批量将任务存到 IndexedDB 中 */
  private static putTasksIntoIndexedDB() {
    let list = this.tmp_tasks
    const len = list.length
    if(len < 1) return

    // 1. 去检查 IndexedDB 是否已存在了

    // 2. 若不存在，存到 IndexedDB

    // 3. 删掉 this.tmp_tasks 前面 len 项

    // 4. 触发 triggerDownload

  }

  /** 告知 CloudToLocal 哪个表、哪一行 
   * 需要从网络下载文件（图片），存到 IndexedDB 中
   * */
  static notify(table: LiuTable, id: string) {
    const data = this.tmp_tasks.find(v => (v.id === id && v.table === table))
    if(data) return

    let _this = this
    this.tmp_tasks.push({ id, table })
    if(this.timeoutOfNotify) return
    this.timeoutOfNotify = setTimeout(() => {
      _this.timeoutOfNotify = undefined
      _this.putTasksIntoIndexedDB()
    }, 50)
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