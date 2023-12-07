import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { Res_UserLoginInit, Res_UserLoginNormal } from "~/requests/data-types"
import localCache from "~/utils/system/local-cache";
import { createClientKey } from "./common-utils"
import { type LiuRqReturn } from "~/requests/tools/types";

export async function fetchInitLogin() {
  const url = APIs.LOGIN
  const res = await liuReq.request<Res_UserLoginInit>(url, { operateType: "init" })

  const pk = res?.data?.publicKey
  if(pk) {
    const { cipher, aesKey } = await createClientKey(pk)
    if(cipher && aesKey) {
      localCache.setOnceData("client_key", aesKey)
      localCache.setOnceData("enc_client_key", cipher)
    }
    
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
  enc_client_key: string,
) {
  const url = APIs.LOGIN
  const opt = {
    operateType: "email_code",
    state,
    enc_email,
    email_code: code,
    enc_client_key,
  }

  const res = await liuReq.request<Res_UserLoginNormal>(url, opt)
  return res
}

export async function fetchOAuth(
  operateType: string,
  oauth_code: string,
  state: string,
  enc_client_key: string,
  oauth_redirect_uri?: string,
) {
  const url = APIs.LOGIN
  const opt = {
    operateType,
    oauth_code,
    state,
    enc_client_key,
    oauth_redirect_uri,
  }
  const res = await liuReq.request<Res_UserLoginNormal>(url, opt)
  return res
}

export async function fetchGoogleCredential(
  google_id_token: string,
  state: string,
  enc_client_key: string,
) {
  const url = APIs.LOGIN
  const opt = {
    operateType: "google_credential",
    google_id_token,
    state,
    enc_client_key,
  }
  const res = await liuReq.request<Res_UserLoginNormal>(url, opt)
  return res
}

export type Fetch_UserLoginNormal = LiuRqReturn<Res_UserLoginNormal>