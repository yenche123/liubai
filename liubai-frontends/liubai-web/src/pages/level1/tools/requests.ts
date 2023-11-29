import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { Res_UserLoginInit, Res_UserLoginNormal } from "~/requests/data-types"
import localCache from "~/utils/system/local-cache";
import { getClientKeyEncrypted } from "./common-utils"

export async function fetchInitLogin() {
  const url = APIs.LOGIN
  const res = await liuReq.request<Res_UserLoginInit>(url, { operateType: "init" })

  const pk = res?.data?.publicKey
  if(pk) {
    const enc_client_key = await getClientKeyEncrypted(pk)
    localCache.setOnceData("enc_client_key", enc_client_key)
  }

  return res
} 

export async function fetchSubmitEmail(
  enc_email: string,
  state: string,
) {
  const url = APIs.LOGIN
  const opt = {
    operateType: "email",
    state,
    enc_email,
  }

  const res = await liuReq.request(url, opt)
  return res
}

export async function fetchEmailCode(
  enc_email: string,
  code: string,
  state: string,
) {
  
}