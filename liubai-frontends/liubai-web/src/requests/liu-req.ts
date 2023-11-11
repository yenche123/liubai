
import localCache from "~/utils/system/local-cache"
import type { LiuRqOpt, LiuRqReturn } from "./tools/types"
import valTool from "~/utils/basic/val-tool"
import time from "~/utils/basic/time"

function _getBody<U extends Record<string, any>>(
  body?: U,
) {
  
  const p = localCache.getLocalPreference()
  const b: Record<string, any> = {
    x_liu_language: navigator.language,
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

    if(err.name === "TimeoutError") {
      return { code: "F0002" }
    }
    if(err.name === "AbortError") {
      return { code: "F0003" }
    }
    return { code: "F0004" }
  }

  let res2 = await res.json() as LiuRqReturn<T>
  return res2
}


export default {
  request,
}