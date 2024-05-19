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
import { useNetworkStore } from "~/hooks/stores/useNetworkStore";
import liuEnv from "../liu-env";

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
    // 0. check out if I have login
    const { local_id: user, token, serial } = localCache.getPreference()
    if(!user || !token || !serial) return false

    // 0.1 check out if I can sync with cloud
    const canSync = liuEnv.canISync()
    if(!canSync) return false

    // 1. add upload task into db
    const res = await addUploadTask(param, user)
    if(!res) return

    // 2. check out if I can trigger immediately
    if(!this.canIPreTigger()) return

    // 3. let's go to trigger
    this.preTrigger(triggerInstantly)
  }


  private static canIPreTigger() {
    const syncNum = CloudEventBus.getSyncNum()
    if(syncNum.value < 1) return false
    const { level } = useNetworkStore()
    console.log("当前网络等级: " + level)
    if(level <= 1) return false
    return true
  }


  // TODO: 立即停止所有上传任务
  private static stopUploadTasks() {

  }


}

export {
  LocalToCloud
}