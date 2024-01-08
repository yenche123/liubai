import { watch } from "vue";
import { CloudEventBus } from "./CloudEventBus";

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
    let { lastTriggerStamp } = this
    
  }


}

export {
  LocalToCloud
}