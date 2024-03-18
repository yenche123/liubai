import { watch } from "vue";
import { CloudEventBus } from "./CloudEventBus";
import time from "../basic/time";

class LocalToCloud {


  static lastTriggerStamp: number | undefined

  static init() {
    let _this = this

    const syncNum = CloudEventBus.getSyncNum()
    watch(syncNum, (newV) => {
      if(!newV) return
      _this.preTrigger()
    }, { immediate: true })
  }

  static preTrigger() {
    let { lastTriggerStamp = 1 } = this
    if(time.isWithinMillis(lastTriggerStamp, time.SECONED)) return
    this.lastTriggerStamp = time.getTime()

    


    
  }


}

export {
  LocalToCloud
}