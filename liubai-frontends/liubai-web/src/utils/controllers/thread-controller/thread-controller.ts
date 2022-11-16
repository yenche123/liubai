// 动态加载管理器
import localGet from "./tools/local-get"
import cloudGet from "./tools/cloud-get"
import type { TcListOption, TcDataOption } from "./type"

async function getList(opt?: TcListOption) {
  const { 
    onlyLocal = true,
  } = opt ?? {}

  if(onlyLocal) {
    const res = await localGet.getList(opt)
    return res
  }
  else {
    cloudGet.getList(opt)
  }
  
  return []
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