
import localCache from "~/utils/system/local-cache"
import type { LiuRqOpt, LiuRqReturn } from "./tools/types"
import valTool from "~/utils/basic/val-tool"
import time from "~/utils/basic/time"
import typeCheck from "~/utils/basic/type-check"
import liuApi from "~/utils/liu-api"
import { toEncrypt, toDecrypt } from "./tools/req-funcs"

async function _getBody<U extends Record<string, any>>(
  body?: U,
) {
  
  const p = localCache.getPreference()

  // 1. encrypt some data in body
  if(body && p.client_key) {
    await handleBeforeFetching(body, p.client_key)
  }

  // 2. add some common data
  const b: Record<string, any> = {
    x_liu_language: navigator.language,
    x_liu_theme: liuApi.getThemeFromSystem(),
    x_liu_version: LIU_ENV.version,
    x_liu_stamp: time.getTime(),
    x_liu_timezone: time.getTimezone().toFixed(1),
    x_liu_client: LIU_ENV.client,
    ...body,
  }

  if(p.token && p.serial) {
    b["x_liu_token"] = p.token
    b["x_liu_serial"] = p.serial
  }

  const b2 = valTool.objToStr(b)
  return b2
}


/**
 * 向后端发起网络请求
 * T: 出参的 data 类型
 * U: 入参类型
 * @param url 请求地址
 * @param body 请求的 body
 */
async function request<
  T extends Record<string, any>,
  U extends Record<string, any> = Record<string, any>,
>(
  url: string,
  body?: U,
  opt?: LiuRqOpt,
): Promise<LiuRqReturn<T>> {

  const b = await _getBody(body)
  let init: RequestInit = {
    method: opt?.method ?? "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: b,
    signal: opt?.signal ?? AbortSignal.timeout(opt?.timeout ?? 10000),
  }
  
  let res: Response
  try {
    res = await fetch(url, init)
  }
  catch(err: any) {
    // console.warn("fetch err...........")
    // console.log(err)
    // console.log(" ")

    const errMsg: unknown = err.toString?.()
    const errName = err.name
    let errMsg2 = ""  // 转成小写的 errMsg

    if(typeCheck.isString(errMsg)) {
      errMsg2 = errMsg.toLowerCase()
    }

    if(errName === "TimeoutError") {
      return { code: "F0002" }
    }
    if(errName === "AbortError") {
      return { code: "F0003" }
    }
    if(errName === "TypeError") {

      // 当后端整个 Shut Down 时，可能抛出这个错误
      if(errMsg2.includes("failed to fetch")) {
        return { code: "B0001" }
      }
      
    }

    return { code: "C0001" }
  }

  // console.log("liu-req res: ")
  // console.log(res)
  // console.log(" ")

  const status = res.status

  // Laf 底层异常
  if(status === 500) {
    return { code: "B0500" }
  }
  // 其他错误皆视为后端在维护中
  if(status > 500 && status < 600) {
    return { code: `B0001` }
  }

  let res2 = await res.json() as LiuRqReturn<T>

  if(res2.data) {
    const newData = await handleAfterFetching(res2.data)
    if(!newData) {
      return { code: "E4009", errMsg: "decrypt error on local client" }
    }
    res2.data = newData
  }

  return res2
}


async function handleBeforeFetching(
  body: any,
  client_key: string,
) {
  const keys = Object.keys(body)
  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    if(!k.startsWith("plz_enc_")) continue
    const newK = k.replace("plz_enc_", "liu_enc_")
    const data = body[k]
    const res = await toEncrypt(data, client_key)
    body[newK] = res as any
    delete body[k]
  }
}

async function handleAfterFetching(
  data: any,
) {

  if(typeof data !== "object") return data

  const p = localCache.getPreference()
  const client_key = p.client_key
  if(!client_key) return

  const keys = Object.keys(data)
  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    const v = data[k]
    if(!k.startsWith("liu_enc_")) continue
    const newK = k.replace("liu_enc_", "")
    const res = await toDecrypt(v, client_key)
    if(res === undefined) {
      return
    }
    data[newK] = res
    delete data[k]
  }

  return data
}



export default {
  request,
}