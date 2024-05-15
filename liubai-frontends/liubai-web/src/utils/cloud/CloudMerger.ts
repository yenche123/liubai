// 处理 sync-get 的工具类
// 处理从云端加载动态、评论（含点赞和表态）至本地
// 再融合进本地的 db 中

import type { CloudMergerOpt, SyncGetAtom } from "~/types/types-cloud";
import type { CmResolver, CmTask } from "./cm-tools/types"
import type { LiuTimeout } from "../basic/type-tool";
import ider from "../basic/ider";
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { Res_SyncGet_Client } from "~/requests/req-types";
import { handleLiuDownloadParcels } from "./cm-tools/handleParcels";

class CloudMerger {

  private static triggerTimeout: LiuTimeout
  private static tasks: CmTask[] = []

  static request(opt: CloudMergerOpt, delay: number = 250) {
    const _this = this
    const param: SyncGetAtom = {
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

  private static async trigger() {
    const len = this.tasks.length
    if(len < 1) return
    const num = Math.min(5, len)
    const list = this.tasks.splice(0, num)
    const atoms = list.map(v => v.data)

    // 1. fetch
    const url = APIs.SYNC_GET
    const opt = {
      operateType: "general_sync",
      plz_enc_atoms: atoms,
    }
    const res1 = await liuReq.request<Res_SyncGet_Client>(url, opt)
    const code1 = res1.code
    const results = res1.data?.results

    // 2. if error happens
    if(code1 !== "0000" || !results) {
      list.forEach(v => v.resolver())
      return
    }

    // 3. handle results
    for(let i1=0; i1<results.length; i1++) {
      const v1 = results[i1]
      const taskId = v1.taskId
      const code2 = v1.code
      const list2 = v1.list
      const task = list.find(v => v.data.taskId === taskId)
      if(code2 !== "0000" || !list2) {
        task?.resolver()
        continue
      }

      await handleLiuDownloadParcels(list2)
      task?.resolver(list2)
    }
    
  }

}


export {
  CloudMerger
}