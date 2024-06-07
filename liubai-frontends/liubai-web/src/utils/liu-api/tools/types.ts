


export interface GetChaRes {
  isPC: boolean
  isMobile: boolean
  isWeChat: boolean
  isIOS: boolean         // 是否为 iphone
  isIPadOS: boolean      // 是否为 iPad
  isMac: boolean         // 是否为 mac，注意 iphone 和 ipad 时，此值可能为 false
  isFeishu: boolean
  isInWebView: boolean
  isFirefox: boolean
  isSafari: boolean
  isChrome: boolean
  isEdge: boolean
  browserVersion?: string
}