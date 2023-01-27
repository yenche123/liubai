// 判断各种特征

let isPC: boolean;
let isMobile: boolean;   // 此字段表示是否为移动装置，包含是否为手机或pad
let isWeChat: boolean = false;
let isIOS: boolean = false;
let isIPadOS: boolean = false;
let isMac: boolean = false;
let isFeishu: boolean = false;
let isInWebView: boolean = false;   // 是否在桌面应用 App 的 Webview 中，小程序也算
let isFirefox: boolean = false;

interface GetChaRes {
  isPC: boolean
  isMobile: boolean
  isWeChat: boolean
  isIOS: boolean         // 是否为 iphone
  isIPadOS: boolean      // 是否为 iPad
  isMac: boolean         // 是否为 mac，注意 iphone 和 ipad 时，此值可能为 false
  isFeishu: boolean
  isInWebView: boolean
  isFirefox: boolean
}

const getCharacteristic = (): GetChaRes => {
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
  if(ua.includes("macintosh")) isMac = true
  if(ua.includes("feishu")) {
    isFeishu = true
    isInWebView = true
  }
  if(ua.includes("firefox")) isFirefox = true

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
    isFeishu, 
    isInWebView,
    isFirefox,
  }
}


export default {
  getCharacteristic
}
