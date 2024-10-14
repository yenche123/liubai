import { watch } from "vue";
import { CloudEventBus } from "./CloudEventBus";
import time from "../basic/time";
import { type LiuTimeout } from "../basic/type-tool";
import localCache from "../system/local-cache";
import type { 
  UploadTaskParam,
  AddUploadTaskOpt,
} from "./tools/types";
import type { SyncSpeed } from "~/types/types-atom";
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

  private static preTrigger(
    speed: SyncSpeed = "normal"
  ) {

    let delay = 250
    if(speed === "instant") delay = 0
    else if(speed = "slow") delay = 750

    const _this = this

    // instantly trigger
    if(delay === 0) {
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

    // 1. If the queue is currently executing, check if it has timed out. 
    //    If it hasn't timed out, ignore this trigger
    const lstu = this.lastStartToUpload
    if(lstu) {
      if(time.isWithinMillis(lstu, MIN_5)) {
        return
      }
      this.stopUploadTasks()
    }

    // 2. start to handle tasks
    this.lastStartToUpload = time.getTime()
    const res2 = await handleUploadTasks()
    this.lastStartToUpload = undefined

    // 3. add more tasks after handleUploadTasks
    if(res2.length < 1) return
    const _this = this
    res2.forEach(v => {
      console.warn("add more task!")
      console.log(v)
      _this.addTask(v, { speed: "slow" })
    })

  }

  /** add a task into local db */
  static async addTask(
    param: UploadTaskParam,
    opt?: AddUploadTaskOpt,
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
    this.preTrigger(opt?.speed)
  }


  private static canIPreTigger() {
    const syncNum = CloudEventBus.getSyncNum()
    if(syncNum.value < 1) return false
    const { level } = useNetworkStore()
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