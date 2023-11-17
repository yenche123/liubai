import type { LocalPreference, LocalOnceData } from "./tools/types";
import liuApi from "../liu-api";

function getLocalPreference(): LocalPreference {
  const res = liuApi.getStorageSync<LocalPreference>("local-preference") || {}
  return res
}

function setLocalPreference<T extends keyof LocalPreference>(
  key: T, data: LocalPreference[T]
) {
  const localP = getLocalPreference()
  localP[key] = data
  const res = liuApi.setStorageSync("local-preference", localP)
}

function getLocalOnceData(): LocalOnceData {
  const res = liuApi.getStorageSync<LocalOnceData>("local-once-data") || {}
  return res
}

function setLocalOnceData(key: keyof LocalOnceData, data: any) {
  const localData = getLocalOnceData()
  localData[key] = data
  const res = liuApi.setStorageSync("local-once-data", localData)
}

export default {
  getLocalPreference,
  setLocalPreference,
  getLocalOnceData,
  setLocalOnceData,
}