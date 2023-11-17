import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { Res_UserLoginInit } from "~/requests/data-types"

export async function fetchInitLogin() {
  const url = APIs.LOGIN
  const res = await liuReq.request<Res_UserLoginInit>(url, { operateType: "init" })
  return res
} 