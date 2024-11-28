import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import { ServicePolyAPI } from "~/types/types-cloud";
import type { BoolFunc } from "~/utils/basic/type-tool";
import wx from "weixin-js-sdk";

const jsApiList: wx.jsApiList = [
  "closeWindow",
]

let activeUrl = ""
let promise: Promise<boolean> | undefined

export function invokeWxJsSdk() {
  const tmpList = location.href.split("#") 
  const currentUrl = tmpList[0]
  if(currentUrl === activeUrl && promise) return promise
  activeUrl = currentUrl

  const _wait = async (a: BoolFunc) => {
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
    console.log("get-wxjssdk-config res1: ")
    console.log(res1)
    console.log(" ")

    if(res1.code !== "0000" || !data1) {
      a(false)
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
      debug: true,
      appId,
      timestamp,
      nonceStr,
      signature,
      jsApiList,
    })

    wx.ready(() => {
      console.warn("wx.ready.........")
      a(true)
    })

    wx.error((err) => {
      console.warn("wx.error.........")
      console.log(err)
      a(false)
    })
  }

  promise = new Promise(_wait)
  return promise
}