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

  private static triggerTimeout: LiuTimeout
  private static lastStartToUpload: number | undefined

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

  private static preTrigger(instant: boolean = false) {
    const delay = 250
    const _this = this

    // if instant is true, then trigger immediately
    if(instant) {
      if(_this.triggerTimeout) {
        clearTimeout(_this.triggerTimeout)
        _this.triggerTimeout = undefined
      }
      _this.toTrigger()
      return
    }

    // otherwise, trigger after 250ms
    // or trigger with the previous call
    if(_this.triggerTimeout) return

    _this.triggerTimeout = setTimeout(() => {
      _this.triggerTimeout = undefined
      _this.toTrigger()
    }, delay)
  }

  private static async toTrigger() {

    // lastStartToUpload 只是避免队列正在执行、重复触发队列的问题
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
  static async addTask(
    param: UploadTaskParam,
    triggerInstantly: boolean = false,
  ) {
    const { local_id: user, token } = localCache.getPreference()
    if(!user || !token) return false

    const res = await addUploadTask(param, user)
    if(res) {
      this.preTrigger(triggerInstantly)
    }
  }

  // TODO: 立即停止所有上传任务
  private static stopUploadTasks() {

  }


}

export {
  LocalToCloud
}