import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { 
  Res_UL_WxGzhScan, 
  Res_UL_ScanCheck,
  Res_UserLoginInit, 
  Res_UserLoginNormal,
} from "~/requests/req-types"
import localCache from "~/utils/system/local-cache";
import { createClientKey } from "./common-utils"
import { type LiuRqReturn } from "~/requests/tools/types";

function _getDefaultOpt() {
  const { theme, language } = localCache.getPreference()
  let opt = {
    theme,
    language,
  }
  return opt
}

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

export async function fetchRequestSMSCode(
  enc_phone: string,
  state: string
) {
  const url = APIs.LOGIN
  const opt = {
    operateType: "phone",
    state,
    enc_phone,
  }

  const res = await liuReq.request(url, opt)
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

export async function fetchPhoneCode(
  enc_phone: string,
  code: string,
  state: string,
  enc_client_key: string
) {
  const url = APIs.LOGIN
  const default_opt = _getDefaultOpt()
  const opt = {
    ...default_opt,
    operateType: "phone_code",
    state,
    enc_phone,
    phone_code: code,
    enc_client_key,
  }
  const res = await liuReq.request<Res_UserLoginNormal>(url, opt)
  return res
}

export async function fetchEmailCode(
  enc_email: string,
  code: string,
  state: string,
  enc_client_key: string,
) {
  const url = APIs.LOGIN
  const default_opt = _getDefaultOpt()
  const opt = {
    ...default_opt,
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
  const default_opt = _getDefaultOpt()
  const opt = {
    ...default_opt,
    operateType,
    oauth_code,
    state,
    enc_client_key,
    oauth_redirect_uri,
  }
  const res = await liuReq.request<Res_UserLoginNormal>(url, opt)
  return res
}

export async function fetchUsersSelect(
  userId: string,
  multi_credential: string,
  multi_credential_id: string,
  state: string,
  enc_client_key: string,
) {
  const url = APIs.LOGIN
  const default_opt = _getDefaultOpt()
  const opt = {
    ...default_opt,
    operateType: "users_select",
    userId,
    multi_credential,
    multi_credential_id,
    state,
    enc_client_key,
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
  const default_opt = _getDefaultOpt()
  const opt = {
    ...default_opt,
    operateType: "google_credential",
    google_id_token,
    state,
    enc_client_key,
  }
  const res = await liuReq.request<Res_UserLoginNormal>(url, opt)
  return res
}

export async function fetchWxGzhScan(
  state: string,
) {
  const url = APIs.LOGIN
  const default_opt = _getDefaultOpt()
  const opt = {
    ...default_opt,
    operateType: "wx_gzh_scan",
    state,
  }
  const res = await liuReq.request<Res_UL_WxGzhScan>(url, opt)
  return res
}

export async function fetchScanCheck(
  credential: string,
) {
  const url = APIs.LOGIN
  const default_opt = _getDefaultOpt()
  const opt = {
    ...default_opt,
    operateType: "scan_check",
    credential,
  }
  const res = await liuReq.request<Res_UL_ScanCheck>(url, opt)
  return res
}

export async function fetchScanLogin(
  credential: string,
  credential_2: string,
  enc_client_key: string,
) {
  const url = APIs.LOGIN
  const default_opt = _getDefaultOpt()
  const opt = {
    ...default_opt,
    operateType: "scan_login",
    credential,
    credential_2,
    enc_client_key,
  }
  const res = await liuReq.request<Res_UserLoginNormal>(url, opt)
  return res
}


export type Fetch_UserLoginNormal = LiuRqReturn<Res_UserLoginNormal>