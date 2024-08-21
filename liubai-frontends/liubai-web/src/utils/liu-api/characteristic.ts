import reg_exp from "~/config/regular-expressions"
import type { GetChaRes } from "./tools/types"

// 判断各种特征

let isPC: boolean;
let isMobile: boolean;   // 此字段表示是否为移动装置，包含是否为手机或pad
let isWeChat = false;
let isIOS = false;
let isIPadOS = false;
let isMac = false;
let isWindows = false;
let isFeishu = false;
let isInWebView = false;   // 是否在桌面应用 App 的 Webview 中，小程序也算
let isFirefox = false;
let isSafari = false;
let isChrome = false;
let isEdge = false;    // if true, isChrome is true as well
let browserVersion: string | undefined;
let isHarmonyOS = false;
let isHuaweiBrowser = false;

export const getCharacteristic = (): GetChaRes => {
  if(isPC !== undefined) {
    return _returnData()
  }

  const { userAgent = "", userAgentData, platform, maxTouchPoints } = navigator
  const ua = userAgent.toLowerCase()
  const mobileMatch = userAgent.match(/AppleWebKit.*Mobile.*/)

  // console.log("userAgentData: ", userAgentData)
  // console.log("ua: ", ua)
  // console.log("mobileMatch: ", mobileMatch)

  // 判断是否为微信环境
  if(ua.includes("micromessenger")) {
    isWeChat = true
    isInWebView = true
  }

  // 判断是否为移动装置
  if(userAgentData?.mobile) {
    isMobile = true
    isPC = false
  }
  else if(!!mobileMatch) {
    isMobile = true
    isPC = false
  }
  else {
    isMobile = false
    isPC = true
  }

  if(ua.includes("iphone")) {
    isIOS = true
    isMobile = true
    isPC = false
  }
  if(ua.includes("ios")) {
    isIOS = true
  }
  if(ua.includes("ipod")) {
    isIOS = true
    isMobile = true
    isPC = false
  }
  if(ua.includes("ipad")) {
    isIPadOS = true
    isMobile = true
    isPC = false
  }

  if(ua.includes("macintosh")) {
    isMac = true
  }
  else if(ua.includes("windows")) {
    isWindows = true
  }

  if(ua.includes("feishu")) {
    isFeishu = true
    isInWebView = true
  }

  if(ua.includes("harmonyos")) {
    isHarmonyOS = true
  }
  if(ua.includes("huaweibrowser")) {
    isHuaweiBrowser = true
  }


  // 判别浏览器
  const edg_version_m = ua.match(reg_exp.edge_version)
  if(edg_version_m) {
    // edge browser
    isEdge = true
    isChrome = true
    browserVersion = edg_version_m[1]
  }
  else if(ua.includes("firefox")) {
    isFirefox = true

    const f_version_m = ua.match(reg_exp.firefox_version)
    browserVersion = f_version_m ? f_version_m[1] : undefined
  }
  else if(ua.includes("chrome")) {
    isChrome = true

    const c_version_m = ua.match(reg_exp.chrome_version)
    browserVersion = c_version_m ? c_version_m[1] : undefined
  }
  else if(ua.includes("safari")) {
    if(!ua.includes("android")) {
      isSafari = true

      const s_version_m = ua.match(reg_exp.safari_version)
      browserVersion = s_version_m ? s_version_m[1] : undefined
    }
  }

  // 处理 iOS 13 之后的 iPad 的 userAgent 里没有 ipad 字段的问题
  // maxTouchPoints 表示设备最多支持一次有多少个 touch 点击
  // 比如触屏设备通常一次两次 touch points 以实现两指 pitch 缩放
  if(!isIPadOS && platform === 'MacIntel' && maxTouchPoints > 1) {
    isIOS = true
    isIPadOS = true
    isMobile = true
    isPC = false
    isMac = false
  }

  let res = _returnData()
  return res
}

function _returnData(): GetChaRes {
  return { 
    isPC, 
    isMobile, 
    isWeChat, 
    isIOS, 
    isIPadOS,
    isMac,
    isWindows,
    isFeishu, 
    isInWebView,
    isFirefox,
    isSafari,
    isChrome,
    isEdge,
    browserVersion,
    isHarmonyOS,
    isHuaweiBrowser,
  }
}
