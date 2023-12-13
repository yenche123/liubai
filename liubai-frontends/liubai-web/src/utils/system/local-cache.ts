import type { 
  LocalPreference, 
  LocalOnceData, 
  LocalConfigData,
} from "./tools/types";
import liuApi from "../liu-api";
import liuEnv from "../liu-env";

function getPreference(): LocalPreference {
  const hasBackend = liuEnv.hasBackend()

  // 云模式
  if(hasBackend) {
    const res0 = liuApi.getStorageSync<LocalPreference>("cloud-preference") || {}
    return res0
  }

  // 纯本地模式
  const res = liuApi.getStorageSync<LocalPreference>("local-preference") || {}
  return res
}

function setPreference<T extends keyof LocalPreference>(
  key: T, data: LocalPreference[T]
) {
  const localP = getPreference()
  localP[key] = data

  const hasBackend = liuEnv.hasBackend()
  if(hasBackend) {
    liuApi.setStorageSync("cloud-preference", localP)
  }
  else {
    liuApi.setStorageSync("local-preference", localP)
  }
}


/********** 一些性、不依赖登录态的数据 ********/
function getOnceData(): LocalOnceData {
  const res = liuApi.getStorageSync<LocalOnceData>("local-once-data") || {}
  return res
}

function setOnceData(key: keyof LocalOnceData, data: any) {
  const localData = getOnceData()
  localData[key] = data
  const res = liuApi.setStorageSync("local-once-data", localData)
}

/********** 配置数据、同样不依赖登录态 ********/
function getConfigData() {
  const res = liuApi.getStorageSync<LocalConfigData>("local-config-data") || {}
  return res
}

function setConfigData(data?: LocalConfigData) {
  if(!data) {
    liuApi.removeStorageSync("local-config-data")
    return
  }
  liuApi.setStorageSync("local-config-data", data)
}


export default {
  getPreference,
  setPreference,
  getOnceData,
  setOnceData,
  getConfigData,
  setConfigData,
}