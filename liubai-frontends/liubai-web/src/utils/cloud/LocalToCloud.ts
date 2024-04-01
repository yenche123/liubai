import { watch } from "vue";
import { CloudEventBus } from "./CloudEventBus";
import time from "../basic/time";
import { type LiuTimeout } from "../basic/type-tool";
import localCache from "../system/local-cache";
import type { UploadTaskParam } from "./tools/types";
import { addUploadTask } from "./tools/add-upload-task";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import { handleUploadTasks } from "./upload-tasks"

const MIN_5 = 5 * time.MINUTE

class LocalToCloud {

  static triggerTimeout: LiuTimeout
  static uploadWorker: Worker | undefined
  static lastStartToUpload: number | undefined

  static init() {
    const _this = this

    const syncNum = CloudEventBus.getSyncNum()
    watch(syncNum, (newV) => {
      if(!newV) return
      _this.preTrigger()
    }, { immediate: true })

    const wStore = useWorkspaceStore()
    const { token } = storeToRefs(wStore)
    watch(token, (newV, oldV) => {

      // 以前没值，表示之前未登录，或者尚未初始化，这时直接忽略
      if(!oldV) return
      
      if(!newV) {
        // 退出登录了
        _this.stopUploadTasks()
      }
      
      
    })
  }

  static preTrigger(instant: boolean = false) {
    const _this = this
    if(_this.triggerTimeout) {
      clearTimeout(_this.triggerTimeout)
    }
    const delay = instant ? 1 : 1500
    _this.triggerTimeout = setTimeout(() => {
      _this.triggerTimeout = undefined
      _this.toTrigger()
    }, delay)
  }

  static async toTrigger() {

    const lstu = this.lastStartToUpload
    if(lstu) {
      if(time.isWithinMillis(lstu, MIN_5)) return
      this.stopUploadTasks()
    }

    this.lastStartToUpload = time.getTime()
    const res = await handleUploadTasks()
    this.lastStartToUpload = undefined
  }

  /** add a task into local db */
  static async addTask(param: UploadTaskParam) {
    const { local_id: user, token } = localCache.getPreference()
    if(!user || !token) return false

    const res = await addUploadTask(param, user)
    if(res) {
      this.preTrigger(true)
    }
  }

  // TODO: 立即停止所有上传任务
  private static stopUploadTasks() {

  }


}

export {
  LocalToCloud
}