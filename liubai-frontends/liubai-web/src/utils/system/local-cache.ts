import type { LocalPreference } from "~/types";
import liuApi from "../liu-api";

function getLocalPreference(): LocalPreference {
  const res = liuApi.getStorageSync<LocalPreference>("local-preference") || {}
  return res
}

function setLocalPreference(key: keyof LocalPreference, data: any) {
  const localP = getLocalPreference()
  localP[key] = data
  const res = liuApi.setStorageSync("local-preference", localP)
  console.log("setLocalPreference 结果...........")
  console.log(res)
  console.log(" ")
}

export default {
  getLocalPreference,
  setLocalPreference,
}