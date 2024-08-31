import reg_exp from "~/config/regular-expressions"
import type { GetChaRes } from "./tools/types"

// 判断各种特征

let isPC: boolean;
let isMobile: boolean;   // 此字段表示是否为移动装置，包含是否为手机或pad
let isWeCom = false;
let isWeChat = false;
let isAlipay = false;
let isDingTalk = false;
let isFeishu = false;
let isQuark = false;
let isUCBrowser = false;
let isIOS = false;
let isIPadOS = false;
let isMac = false;
let isWindows = false;
let isInWebView = false;   // 是否在桌面应用 App 的 Webview 中，小程序也算
let isFirefox = false;
let isSafari = false;
let isChrome = false;
let isEdge = false;    // if true, isChrome is true as well
let browserVersion: string | undefined;
let appVersion: string | undefined;
let isHarmonyOS = false;
let isHuaweiBrowser = false;
let isAndroid = false;

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
  if(ua.includes("wxwork")) {
    isWeCom = true
    isInWebView = true
  }
  else if(ua.includes("micromessenger")) {
    isWeChat = true
    isInWebView = true
  }
  else if(ua.includes("dingtalk")) {
    isDingTalk = true
    isInWebView = true
  }
  else if(ua.includes("alipayclient")) {
    isAlipay = true
    isInWebView = true
  }
  else if(ua.includes("feishu")) {
    isFeishu = true
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
  else if(ua.includes("android")) {
    if(!isIOS && !isMac) {
      isAndroid = true
    }
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

  if(isIOS && !browserVersion) {
    const ios_version_m = ua.match(reg_exp.ios_version)
    const tmpVersion = ios_version_m ? ios_version_m[1] : undefined
    if(tmpVersion) {
      browserVersion = tmpVersion.replace("_", ".")
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

export const getDeviceString = (
  cha?: GetChaRes,
) => {
  if(!cha) cha = getCharacteristic()
  let str = ""

  if(cha.isPC) str += "PC "
  else if(cha.isMobile) str += "Mobile "

  if(cha.isWeCom) str += "WeCom "
  else if(cha.isWeChat) str += "WeChat "
  else if(cha.isDingTalk) str += "DingTalk "
  else if(cha.isAlipay) str += "Alipay "
  else if(cha.isFeishu) str += "Feishu "
  else if(cha.isUCBrowser) str += "UCBrowser "
  else if(cha.isQuark) str += "Quark "

  if(cha.isIOS) str += "iOS "
  if(cha.isIPadOS) str += "iPadOS "

  if(cha.isMac) str += "Mac "
  else if(cha.isWindows) str += "Windows "

  if(cha.isInWebView) str += "WebView "
  if(cha.isFirefox) str += "Firefox "
  if(cha.isSafari) str += "Safari "
  if(cha.isChrome) str += "Chrome "
  if(cha.isEdge) str += "Edge "
  if(cha.isHarmonyOS) str += "HarmonyOS "
  if(cha.isHuaweiBrowser) str += "HuaweiBrowser "
  
  if(cha.browserVersion) {
    str += `v${cha.browserVersion}`
  }
  
  return str
}

function _returnData(): GetChaRes {
  return { 
    isPC, 
    isMobile, 
    isWeCom,
    isWeChat, 
    isAlipay,
    isDingTalk,
    isFeishu, 
    isQuark,
    isUCBrowser,
    isIOS, 
    isIPadOS,
    isMac,
    isWindows,
    isInWebView,
    isFirefox,
    isSafari,
    isChrome,
    isEdge,
    browserVersion,
    appVersion,
    isHarmonyOS,
    isHuaweiBrowser,
    isAndroid,
  }
}
