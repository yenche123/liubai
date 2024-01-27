import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { Res_UserSettings_Enter, Res_HelloWorld } from "~/requests/req-types"

export async function fetchHelloWorld() {
  const url = APIs.TIME
  const res = await liuReq.request<Res_HelloWorld>(url)
  return res
}

export async function fetchUserEnter() {
  const url = APIs.USER_ENTER
  const res = await liuReq.request<Res_UserSettings_Enter>(url, { operateType: "enter" })
  return res
}
