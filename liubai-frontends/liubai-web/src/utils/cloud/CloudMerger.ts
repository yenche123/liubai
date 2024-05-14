// 处理 sync-get 的工具类
// 处理从云端加载动态、评论（含点赞和表态）至本地
// 再融合进本地的 db 中

import type { CloudMergerOpt, Param_SyncGet } from "~/types/types-cloud";
import type { CmResolver, CmTask } from "./cm-tools/types"
import type { LiuTimeout } from "../basic/type-tool";
import ider from "../basic/ider";

class CloudMerger {

  private static triggerTimeout: LiuTimeout
  private static tasks: CmTask[] = []

  static request(opt: CloudMergerOpt, delay: number = 250) {
    const _this = this
    const param: Param_SyncGet = {
      ...opt,
      taskId: ider.createSyncGetTaskId(),
    }

    const _foo = (a: CmResolver) => {
      // 1. package CmTask
      const task: CmTask = {
        data: param,
        resolver: a,
      }
      _this.tasks.push(task)

      // 2. prepare to trigger
      if(_this.triggerTimeout) {
        clearTimeout(_this.triggerTimeout)
      }
      _this.triggerTimeout = setTimeout(() => {
        _this.triggerTimeout = undefined
        _this.trigger()
      }, delay)
    }

    return new Promise(_foo)
  }

  private static trigger() {
    
  }

}


export {
  CloudMerger
}