import {
  handleBeforeFetching,
  handleAfterFetching,
} from "~/requests/tools/req-funcs"
import type { MainToChildMessage } from "../../tools/types"
import type { LiuRqOpt, LiuRqReturn } from "~/requests/tools/types"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import typeCheck from "~/utils/basic/type-check"

let default_body: Record<string, any> = {}
let client_key = ""
function init(msg: MainToChildMessage) {
  default_body = {
    x_liu_language: msg.system_language,
    x_liu_theme: msg.system_theme,
    x_liu_version: LIU_ENV.version,
    x_liu_timezone: time.getTimezone().toFixed(1),
    x_liu_client: LIU_ENV.client,
    x_liu_token: msg.token,
    x_liu_serial: msg.serial,
  }
  if(msg.client_key) {
    client_key = msg.client_key
  }
}

async function _getBody<U extends Record<string, any>>(
  body?: U,
) {
  if(body && client_key) {
    handleBeforeFetching(body, client_key)
  }
  const b1 = {
    ...default_body,
    ...body,
  }
  const b2 = valTool.objToStr(b1)
  return b2
}


async function request<
  T extends Record<string, any>,
  U extends Record<string, any> = Record<string, any>,
>(
  url: string,
  body?: U,
  opt?: LiuRqOpt,
) {
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
      if(errMsg2.includes("failed to fetch")) {
        return { code: "B0001" }
      }
    }
    return { code: "C0001" }
  }


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

  if(res2.data && client_key) {
    const newData = await handleAfterFetching(res2.data, client_key)
    if(!newData) {
      return { code: "E4009", errMsg: "decrypt error on local client" }
    }
    res2.data = newData
  }

  return res2
}

export default {
  init,
  request,
}

