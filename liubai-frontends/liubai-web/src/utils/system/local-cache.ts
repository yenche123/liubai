import type { 
  LocalPreference, 
  LocalOnceData, 
  KeyOfLocalOnceData,
  LocalConfigData,
} from "./tools/types";
import liuApi from "../liu-api";
import liuEnv from "../liu-env";

function _getPreKey() {
  const hasBackend = liuEnv.hasBackend()
  const key = hasBackend ? "cloud-preference" : "local-preference"
  return key
}

function getPreference(): LocalPreference {
  const key = _getPreKey()
  const res = liuApi.getStorageSync<LocalPreference>(key) || {}
  return res
}

function setPreference<T extends keyof LocalPreference>(
  key: T, data: LocalPreference[T]
) {
  const localP = getPreference()
  localP[key] = data

  const key2 = _getPreKey()
  liuApi.setStorageSync(key2, localP)
}

function setAllPreference(obj: LocalPreference) {
  const key = _getPreKey()
  liuApi.setStorageSync(key, obj)
}

function clearPreference() {
  const key = _getPreKey()
  liuApi.removeStorageSync(key)
}


/********** 一些性、不依赖登录态的数据 ********/
function getOnceData(): LocalOnceData {
  const res = liuApi.getStorageSync<LocalOnceData>("local-once-data") || {}
  return res
}

function setOnceData(key: KeyOfLocalOnceData, data: any) {
  const localData = getOnceData()
  localData[key] = data
  const res = liuApi.setStorageSync("local-once-data", localData)
}

function removeOnceDataWhileLogging() {
  const localData = getOnceData()
  const keys: KeyOfLocalOnceData[] = [
    "client_key", "enc_client_key", "githubOAuthState", "googleOAuthState"
  ]
  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    localData[k] = undefined
  }
  liuApi.setStorageSync("local-once-data", localData)
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

/*********** 是否具备后端并且已登录 */
function hasLoginWithBackend() {
  const {
    local_id,
    serial,
    token,
  } = getPreference()
  if(local_id && serial && token) return true
  return false
}


export default {
  getPreference,
  setPreference,
  setAllPreference,
  clearPreference,
  getOnceData,
  setOnceData,
  removeOnceDataWhileLogging,
  getConfigData,
  setConfigData,
  hasLoginWithBackend,
}