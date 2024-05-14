// 动态加载管理器
import localGet from "./tools/local-get"
import type { TcListOption, TcDataOption } from "./type"

async function getList(opt: TcListOption) {
  const res = await localGet.getList(opt)
  return res
}


async function getData(opt: TcDataOption) {
  const { id } = opt
  const res = await localGet.getData(id)
  return res
}

export default {
  getList,
  getData,
}