


export interface GetChaRes {
  isPC: boolean
  isMobile: boolean
  isWeCom: boolean
  isWeChat: boolean
  isAlipay: boolean
  isDingTalk: boolean
  isFeishu: boolean
  isQuark: boolean
  isUCBrowser: boolean
  isIOS: boolean         // 是否为 iphone
  isIPadOS: boolean      // 是否为 iPad
  isMac: boolean         // 是否为 mac，注意 iphone 和 ipad 时，此值可能为 false
  isWindows: boolean
  isInWebView: boolean
  isFirefox: boolean
  isSafari: boolean
  isChrome: boolean
  isEdge: boolean
  browserVersion?: string
  appVersion?: string
  isHarmonyOS: boolean
  isHuaweiBrowser: boolean
  isAndroid: boolean
}