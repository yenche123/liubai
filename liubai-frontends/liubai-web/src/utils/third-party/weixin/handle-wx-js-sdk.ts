import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import { ServicePolyAPI } from "~/types/types-cloud";
import type { BoolFunc } from "~/utils/basic/type-tool";
import wx from "weixin-js-sdk";

const jsApiList: wx.jsApiList = [
  "closeWindow",
]

export function getGlobalWx() {
  return wx
}

let activeUrl = ""
let promise: Promise<boolean> | undefined
export function invokeWxJsSdk(
  maxWaitMilli: number = 3000
) {
  const tmpList = location.href.split("#") 
  const currentUrl = tmpList[0]
  if(currentUrl === activeUrl && promise) return promise
  activeUrl = currentUrl

  const _wait = async (a: BoolFunc) => {

    // 0. set timeout
    let hasFinished = false
    const timeout = setTimeout(() => {
      hasFinished = true
      a(false)
    }, maxWaitMilli)
    const _sendResult = (isOK: boolean) => {
      if(hasFinished) return
      hasFinished = true
      a(isOK)
      clearTimeout(timeout)
    }

    // 1. fetch 
    const link1 = APIs.SERVICE_POLY
    const body1: ServicePolyAPI.Param = {
      operateType: "get-wxjssdk-config",
      url: currentUrl,
    }
    const res1 = await liuReq.request<ServicePolyAPI.Res_GetWxjssdkConfig>(
      link1, 
      body1,
    )
    const data1 = res1.data
    if(res1.code !== "0000" || !data1) {
      console.warn("get-wxjssdk-config fail........")
      console.log(res1)
      console.log(" ")
      _sendResult(false)
      return
    }

    // 2. invoke config
    const {
      appId,
      timestamp,
      nonceStr,
      signature,
    } = data1
    console.log("wx.config.........")

    wx.config({
      appId,
      timestamp,
      nonceStr,
      signature,
      jsApiList,
    })

    wx.ready(() => {
      console.warn("wx.ready.........")
      _sendResult(true)
    })

    wx.error((err) => {
      console.warn("wx.error.........")
      console.log(err)
      _sendResult(false)
    })
  }

  promise = new Promise(_wait)
  return promise
}