// 动态加载管理器

import localGet from "./tools/local-get"
import cloudGet from "./tools/cloud-get"

export interface TcListOption {

  // 是否为仅本地获取，默认为 ture
  // 若为 false 则从云端获取，获取过程中会把更新融进 IndexedDB 里
  // 再把包含 LOCAL / ONLY_LOCAL 的数据返回给调用者，让业务侧能批量绑定到视图上，无需过滤
  onlyLocal?: boolean

  // 默认为 ME
  workspace?: string    

  // 已加载出来的最后一个 id 的 createdStamp，注意不是 insertedStamp
  lastCreatedStamp?: number
}

export interface TcDataOption {
  id: string
  onlyLocal?: boolean
}


async function getList(opt?: TcListOption) {
  const { onlyLocal = true, workspace = "ME", lastCreatedStamp } = opt ?? {}

  if(onlyLocal) {
    localGet.getList(workspace, lastCreatedStamp)
  }
  else {
    cloudGet.getList(workspace, lastCreatedStamp)
  }
  
}


async function getData(opt: TcDataOption) {
  const { id, onlyLocal = true } = opt
  if(onlyLocal) {
    localGet.getData(id)
  }
  else {
    cloudGet.getData(id)
  }
}

export default {
  getList,
  getData,
}