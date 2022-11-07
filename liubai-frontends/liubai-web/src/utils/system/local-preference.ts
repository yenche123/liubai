import type { LocalPreference } from "../../types";
import liuApi from "../liu-api";



export function getLocalPreference(): LocalPreference {
  const res = liuApi.getStorageSync<LocalPreference>("local-preference") || {}
  return res
}

export function setLocalPreference(key: keyof LocalPreference, data: any) {
  const localP = getLocalPreference()
  localP[key] = data
  const res = liuApi.setStorageSync("local-preference", localP)
  console.log("setLocalPreference 结果...........")
  console.log(res)
  console.log(" ")
}
