import { watch } from "vue";
import { CloudEventBus } from "./CloudEventBus";
import time from "../basic/time";
import { type LiuTimeout } from "../basic/type-tool";
import UploadWorker from "./workers/task-to-upload?worker"
import localCache from "../system/local-cache";
import type { UploadTaskParam } from "./tools/types";
import { addUploadTask } from "./tools/add-upload-task";
import { getMainToChildMessage } from "./tools/some-funcs"

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

  static toTrigger() {
    const _this = this

    const lstu = this.lastStartToUpload
    if(lstu) {
      if(time.isWithinMillis(lstu, MIN_5)) return
      _this.closeUploadWorker()
    }

    _this.uploadWorker = new UploadWorker()
    _this.uploadWorker.onmessage = (e) => {
      const txt = e.data
      

      _this.lastStartToUpload = undefined
      _this.closeUploadWorker()
    }

    const msg = getMainToChildMessage("start")
    _this.lastStartToUpload = time.getTime()
    _this.uploadWorker.postMessage(msg)
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


  private static closeUploadWorker() {
    this.uploadWorker?.terminate?.()
    this.uploadWorker = undefined
  }


}

export {
  LocalToCloud
}