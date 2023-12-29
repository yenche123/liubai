import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { Res_UserSettings_Enter } from "~/requests/data-types"


export async function fetchUserEnter() {
  const url = APIs.USER_ENTER
  const res = await liuReq.request<Res_UserSettings_Enter>(url, { operateType: "enter" })
  return res
}
