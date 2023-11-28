
import localCache from "~/utils/system/local-cache"
import type { LiuRqOpt, LiuRqReturn } from "./tools/types"
import valTool from "~/utils/basic/val-tool"
import time from "~/utils/basic/time"
import typeCheck from "~/utils/basic/type-check"
import liuApi from "~/utils/liu-api"

function _getBody<U extends Record<string, any>>(
  body?: U,
) {
  
  const p = localCache.getPreference()
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

  let init: RequestInit = {
    method: opt?.method ?? "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: _getBody(body),
    signal: opt?.signal ?? AbortSignal.timeout(opt?.timeout ?? 5000),
  }
  
  let res: Response
  try {
    res = await fetch(url, init)
  }
  catch(err: any) {
    console.warn("fetch err...........")
    console.log(err)
    console.log(" ")

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
  return res2
}


export default {
  request,
}