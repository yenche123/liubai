// Function Name: common-util

// 存放一些公共函数
import cloud from '@lafjs/cloud'
import * as crypto from "crypto"
import type { 
  LiuSpaceAndMember,
  MemberAggSpaces,
  LocalTheme,
  LocalLocale,
  SupportedLocale,
  Shared_TokenUser,
  VerifyTokenOpt,
  VerifyTokenRes,
  Table_Token,
  Table_User,
  LiuUserInfo,
  SupportedClient,
  PartialSth,
  LiuRqReturn,
  CryptoCipherAndIV,
  LiuPlainText,
  Cloud_ImageStore,
  Cloud_FileStore,
  LiuContent,
  VerifyTokenRes_A,
  VerifyTokenRes_B,
  LiuRqOpt,
  Table_Config,
  CommonPass,
  Table_Member,
  CommonPass_A,
  LiuNodeType,
  GetChaRes,
  Table_Order,
  Wx_Res_GzhUserInfo,
  Wx_Res_Common,
  Wx_Res_GzhOAuthAccessToken,
  WxpayReqAuthorizationOpt,
  Wxpay_Cert_Info,
  LiuWxpayCert,
  WxpayVerifySignOpt,
  LiuErrReturn,
  Res_Wxpay_Transaction,
  Wxpay_Resource_Base,
  SubscriptionPaymentCircle,
  Wxpay_Refund_Custom_Param,
  DataPass,
  Res_Wxpay_Refund,
  Table_Subscription,
  UserSubscription,
  Alipay_Refund_Param,
  Res_Alipay_Refund,
} from '@/common-types'
import { 
  sch_opt_arr,
  supportedLocales,
  Sch_Cloud_FileStore,
  Sch_Cloud_ImageStore,
  Sch_Simple_LiuContent,
} from "@/common-types"
import { 
  createToken, 
  createEncNonce, 
  createImgId, 
  createOrderId,
  createPaymentNonce,
} from "@/common-ids"
import { 
  getNowStamp, 
  getBasicStampWhileAdding, 
  SECONED, DAY, MINUTE,
  localizeStamp,
  isWithinMillis,
  getServerTimezone,
  formatTimezone,
  currentHoursOfSpecificTimezone, 
} from "@/common-time"
import geoip from "geoip-lite"
import Stripe from "stripe"
import * as vbot from "valibot"
import { 
  dateLang, 
  getCurrentLocale, 
  getFallbackLocale, 
  useI18n,
} from '@/common-i18n'
import { wechat_tag_cfg } from '@/common-config'
import { 
  wxpay_apiclient_serial_no,
  wxpay_apiclient_key,
  alipay_cfg,
} from "@/secret-config"
import { 
  addHours,
  addDays, 
  addMonths,
  addYears, 
  set as date_fn_set,
  differenceInCalendarDays,
} from "date-fns"
import { AlipaySdk, type AlipayCommonResult } from "alipay-sdk"

const db = cloud.database()
const _ = db.command

/********************* 常量 ****************/
const SEC_5 = SECONED * 5
const MIN_3 = MINUTE * 3
const MIN_5 = MINUTE * 5
const DAY_90 = DAY * 90
const DAY_28 = DAY * 28
const DAY_7 = DAY * 7

export const reg_exp = {
  chrome_version: /chrome\/([\d\.]+)/,
  edge_version: /edg\/([\d\.]+)/,
  firefox_version: /firefox\/([\d\.]+)/,
  safari_version: /version\/([\d\.]+)/,
  ios_version: /iphone os ([\d_]+)/,
}

// @see https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Service_Center_messages.html#7
const API_TYPING = "https://api.weixin.qq.com/cgi-bin/message/custom/typing"
const API_TAG_USER = "https://api.weixin.qq.com/cgi-bin/tags/members/batchtagging"
const API_UNTAG_USER = "https://api.weixin.qq.com/cgi-bin/tags/members/batchuntagging"

// @see https://developers.weixin.qq.com/doc/offiaccount/User_Management/Get_users_basic_information_UnionID.html
const API_USER_INFO = "https://api.weixin.qq.com/cgi-bin/user/info"

// 微信公众号 OAuth2 使用 code 去换用户的 accessToken
const WX_GZH_OAUTH_ACCESS_TOKEN = "https://api.weixin.qq.com/sns/oauth2/access_token"

// 微信支付 下载平台证书
const WXPAY_DOMAIN = "https://api.mch.weixin.qq.com"
const WXPAY_OUT_TRADE_NO = `/v3/pay/transactions/out-trade-no/`
const WXPAY_REFUND_PATH = `/v3/refund/domestic/refunds`

/********************* 空函数 ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with common-util")
  return true
}


/********************* 基础工具函数 ****************/

const waitMilli = (milli: number = 0): Promise<true> => {
  let _t = (a: (a1: true) => void) => {
    setTimeout(() => {
      a(true)
    }, milli)
  }

  return new Promise(_t)
}

// 字符串转对象
function strToObj<T = any>(str: string): T {
  let res = {}
  try {
    res = JSON.parse(str)
  }
  catch(err) {}
  return res as T
}

// 对象转字符串
function objToStr<T = any>(obj: T): string {
  let str = ``
  try {
    str = JSON.stringify(obj)
  }
  catch(err) {}
  return str
}

/**
 * minus one and make sure that
 * the new value is greater than or equal to 0
 * @param oldVal original value, which is minuend
 * @param subtrahend subtrahend, whose default value is 1
 */
function minusAndMinimumZero(
  oldVal: number | undefined,
  subtrahend: number = 1,
) {
  if(!oldVal) return 0
  let newVal = oldVal - subtrahend
  if(newVal < 0) return 0
  return newVal
}

// removing duplicates from an array
const uniqueArray = (arr: string[]) => {
  const uniqueSet = new Set(arr)
  const uniqueArr = [...uniqueSet]
  return uniqueArr
}


/**
 * format 0-9 to 00-09
 * format -1 ~ -9 into -01 ~ -09
 */
const format0 = (val: string | number): string => {
  if(typeof val === "number") {
    if(val >= 0 && val < 10) return "0" + val
    else if(val > -10 && val < 0) return `-0${Math.abs(val)}`
    return "" + val  
  }
  if(val.length < 2) return "0" + val
  if(val[0] === "-") {
    const num = Number(val)
    if(isNaN(num)) return val
    if(num > -10 && num < 0) return `-0${Math.abs(num)}`
  }
  return val
}


const copyObject = <T = any>(obj: T): T => {
  let type = typeof obj
  if(type !== "object") return obj

  let obj2: T;
  try {
    obj2 = JSON.parse(JSON.stringify(obj))
  }
  catch(err) {
    return obj
  }
  return obj2
}


const encode_URI_component = (uri: string | boolean | number) => {
  let str = ""
  try {
    str = encodeURIComponent(uri)
  }
  catch(err) {
    console.warn("encodeURIComponent 出错......")
    console.log(err)
  }
  return str
}

const hasValue = <T>(
  val: any, 
  type: string,
  checkLength: boolean = true,
): val is T => {
  if(val && typeof val === type) {
    if(checkLength && Array.isArray(val)) {
      if(val.length < 1) return false
    }
    return true
  }
  return false
}

const isStringWithVal = (val: any): val is string => {
  return hasValue<string>(val, "string")
}

const isLatinChar = (char: string) => {
  const isEng1 = char >= "a" && char <= "z"
  if(isEng1) return true
  const isEng2 = char >= "A" && char <= "Z"
  if(isEng2) return true
  const isNum = char >= "0" && char <= "9"
  if(isNum) return true
  return false
}

export const valTool = {
  waitMilli,
  strToObj,
  objToStr,
  minusAndMinimumZero,
  uniqueArray,
  format0,
  copyObject,
  encode_URI_component,
  hasValue,
  isStringWithVal,
  isLatinChar,
}


/********************* 一些工具函数 *****************/

export function getIp(ctx: FunctionContext) {
  const ip = ctx?.headers?.['x-real-ip']
  if(ip && typeof ip === "string") return ip

  const ip2 = ctx?.headers?.['x-forwarded-for']
  if(ip2 && typeof ip2 === "string") return ip2
}

interface Res_LiuFetch<T> {
  status: number
  headers: any
  text?: string
  json?: T
}

export async function liuFetch<T = any>(
  url: string,
  reqInit: RequestInit,
  body?: Record<string, any>,
): Promise<LiuRqReturn<Res_LiuFetch<T>>> {
  let res: Response

  if(body) {
    reqInit.body = objToStr(body)
  }

  try {
    res = await fetch(url, reqInit)
  }
  catch(err: any) {
    console.warn("fetch err")
    console.log(err)
    const errMsg: unknown = err.toString?.()
    const errName = err.name
    let errMsg2 = ""  // 转成小写的 errMsg

    if(typeof errMsg === "string") {
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

  let text: string | undefined
  try {
    text = await res.text()
  }
  catch(err) {
    console.warn("res.text() err")
    return { code: "E5001", errMsg: "res.text() err" }
  }

  let json: T | undefined
  try {
    json = valTool.strToObj(text)
  }
  catch(err) {
    console.warn("getting json failed")
    console.log(err)
  }

  const data = {
    status: res.status,
    headers: res.headers,
    text,
    json,
  }
  return { code: "0000", data }
}

export async function liuReq<T = any>(
  url: string,
  body?: Record<string, any>,
  opt?: LiuRqOpt,
): Promise<LiuRqReturn<T>> {

  const init: RequestInit = {
    method: opt?.method ?? "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  }
  if(body) {
    init.body = objToStr(body)
  }
  if(opt?.headers) {
    init.headers = { ...init.headers, ...opt.headers }
  }

  let res: Response
  try {
    res = await fetch(url, init)
  }
  catch(err: any) {
    console.warn("fetch err")
    console.log(err)
    const errMsg: unknown = err.toString?.()
    const errName = err.name
    let errMsg2 = ""  // 转成小写的 errMsg

    if(typeof errMsg === "string") {
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
  if(status === 500) {
    return { code: "B0500" }
  }
  if(status > 500 && status < 600) {
    return { code: `B0001` }
  }

  try {
    let res2: T = await res.json()
    return {
      code: "0000",
      data: res2,
    }
  }
  catch(err) {
    console.warn("res.json err")
    console.log(err)
  }

  return { code: "E5001" }
}

/** show date / time */
export class LiuDateUtil {

  static showBasicTime(
    stamp: number,
    locale?: SupportedLocale,
    timezone?: string,
  ) {
    if(!locale) {
      locale = getFallbackLocale()
    }
    const newStamp = localizeStamp(stamp, timezone)
    const d = new Date(newStamp)
    const { t } = useI18n(dateLang, { locale })
  
    const mm = valTool.format0(d.getMonth() + 1)
    const hr = valTool.format0(d.getHours())
    const min = valTool.format0(d.getMinutes())
    const MON = t("m_" + mm)
    const DAY = t("day_" + d.getDay())
    
    const mm2 = locale === "en" ? MON : String(d.getMonth() + 1)
    const dd2 = String(d.getDate())
    return t("show_1", { mm: mm2, dd: dd2, day: DAY, hr, min })
  }

  static displayTime(
    stamp: number,
    locale?: SupportedLocale,
    timezone?: string,
  ) {
    if(!locale) {
      locale = getFallbackLocale()
    }
    const newStamp = localizeStamp(stamp, timezone)
    const d = new Date(newStamp)
    const currentStamp = localizeStamp(getNowStamp(), timezone)
    const d2 = new Date(currentStamp)
    const { t } = useI18n(dateLang, { locale})
    
  
    const yyyy = valTool.format0(d.getFullYear())
    let mm = String(d.getMonth() + 1)
    let dd = String(d.getDate())
    const hr = valTool.format0(d.getHours())
    const min = valTool.format0(d.getMinutes())
  
    if(locale === "en") {
      mm = valTool.format0(mm)
      dd = valTool.format0(dd) 
    }
    
    const yyyy2 = valTool.format0(d2.getFullYear())
    if(yyyy !== yyyy2) {
      return t("show_3", { yyyy, mm, dd, hr, min })
    }
  
    return t("show_2", { mm, dd, hr, min })
  }

  static transformStampIntoStr(stamp: number) {
    const d = new Date(stamp)
    const yyyy = d.getFullYear()
    const mm = format0(d.getMonth() + 1)
    const dd = format0(d.getDate())
    const hr = format0(d.getHours())
    const min = format0(d.getMinutes())
    const sec = format0(d.getSeconds())
    return `${yyyy}-${mm}-${dd}T${hr}:${min}:${sec}`
  }

  static getYYYYMMDD(stamp: number) {
    const str = this.transformStampIntoStr(stamp)
    return str.substring(0, 10)
  }

  static transformStampIntoRFC3339(
    stamp: number,
    timezone?: number,
  ) {
    let str1 = this.transformStampIntoStr(stamp)
  
    if(typeof timezone === "undefined") {
      timezone = getServerTimezone()
    }
    let str2 = ""
    const zoneStr = String(timezone)
    const zoneArr = zoneStr.split(".")
    if(!zoneArr || zoneArr.length < 1) {
      console.warn("transformStampIntoRFC3339() zoneArr is not valid")
      return
    }
    const arr0 = zoneArr[0]
    const arr1 = zoneArr[1]
    if(timezone >= 0) {
      str2 = `+${format0(arr0)}:`
    }
    else {
      str2 = `${format0(arr0)}:`
    }
    if(arr1 === "5") {
      str2 += `30`
    }
    else {
      str2 += `00`
    }
    
    const res = str1 + str2
    return res
  }

  static transformRFC3339ToStamp(str: string) {
    try {
      const d = new Date(str)
      const stamp = d.getTime()
      if(isNaN(stamp)) return
      return stamp
    }
    catch(err) {
      console.warn("transformRFC3339ToStamp() err")
      console.log(err)
    }
  }

  // extend the expire time of user's subscription
  static getNewExpireStamp(
    payment_circle: SubscriptionPaymentCircle,
    payment_timezone?: string,
    oldExpireStamp?: number,
  ) {
    const now = getNowStamp()
    let startStamp = oldExpireStamp ? oldExpireStamp : now
    if(startStamp < now) {
      startStamp = now
    }
  
    const startDate = new Date(startStamp)
    let endDate = new Date(startStamp)
    if(payment_circle === "monthly") {
      endDate = addMonths(startDate, 1)
      const diffDays = differenceInCalendarDays(endDate, startDate)
      console.warn("monthly diffDays: ", diffDays)
      const diffOfDiffDays = 30 - diffDays
      if(diffOfDiffDays > 0) {
        endDate = addDays(endDate, diffOfDiffDays)
      }
    }
    else if(payment_circle === "quarterly") {
      endDate = addMonths(startDate, 3)
      const diffDays = differenceInCalendarDays(endDate, startDate)
      console.warn("quarterly diffDays: ", diffDays)
      const diffOfDiffDays = 90 - diffDays
      if(diffOfDiffDays > 0) {
        endDate = addDays(endDate, diffOfDiffDays)
      }
    }
    else if(payment_circle === "yearly") {
      endDate = addYears(startDate, 1)
    }
  
    // set endDate to 23:59:59 for user's timezone
    const userTimezone = formatTimezone(payment_timezone)
    // get what o'clock for user's timezone
    const userHrs = currentHoursOfSpecificTimezone(userTimezone)
    const diffHrs = 23 - userHrs
    if(diffHrs !== 0) {
      endDate = addHours(endDate, diffHrs)
    }
    // turn the minutes & seconds into 59 and 59
    endDate = date_fn_set(endDate, { minutes: 59, seconds: 59, milliseconds: 0 })
    
    const endStamp = endDate.getTime()
    return endStamp
  }

}

/**
 * 获取新增的数据的 _id
 * @param res 运行 await collection(表名).add() 后的返回数据
 */
export function getDocAddId(res: any) {
  if(!res) {
    console.log("getDocAddId() the res has not existed")
    return
  }

  const _id = res.id
  if(!_id) {
    console.log("getDocAddId() _id has not existed")
    return
  }

  if(typeof _id !== "string") {
    console.log("getDocAddId() _id is not string")
    return
  }

  return _id
}

/** 给定文件名或含后缀的文件路径 获取后缀（不含.） 
 *  会将后缀转为小写
 *  若提取失败 则返回空的字符串
*/
export function getSuffix(name: string) {
  let arr = /\.([\w]*)$/.exec(name)
  if(!arr) return ""
  const format = arr[1].toLowerCase()
  if(format.length > 9) return ""
  return format
}

export function getMimeTypeSuffix(name: string) {
  let arr = /\/([\w]*)$/.exec(name)
  if(!arr) return ""
  const format = arr[1].toLowerCase()
  if(format.length > 9) return ""
  return format
}

/** generate avatar from third party's url */
export function generateAvatar(url: string) {
  const imgId = createImgId()
  const suffix = getSuffix(url)
  const name = suffix ? `${imgId}.${suffix}` : imgId
  const now = getNowStamp()
  const obj: Cloud_ImageStore = {
    id: imgId,
    name,
    lastModified: now,
    url,
  }
  return obj
}


/********************* 封装函数 *****************/

/** 将聚合搜索（联表查询）到的 member 和 workspace 信息打包装 
 * 成 LiuSpaceAndMember(LSAM)
 * @param data 聚合搜素后的 res.data
 * @param filterMemberLeft 是否过滤掉成员已退出，默认为 true
*/
function turnMemberAggsIntoLSAMs(
  user: Table_User,
  data: MemberAggSpaces[] | null,
  filterMemberLeft: boolean = true,
) {

  const len1 = data?.length
  const isDataExisted = Boolean(len1)
  if(!len1 || !isDataExisted) {
    return []
  }

  const list: LiuSpaceAndMember[] = []

  for(let i=0; i<len1; i++) {
    const v = data[i] as MemberAggSpaces
    const member_oState = v.oState
    if(member_oState === "LEFT" && filterMemberLeft) continue

    const { spaceList } = v
    const len2 = spaceList?.length
    if(!len2) continue
    const theSpace = spaceList[0]
    const space_oState = theSpace.oState
    if(space_oState !== "OK") continue

    const member_name = getUserName(user, v)
    const obj: LiuSpaceAndMember = {
      memberId: v._id,
      member_name,
      member_avatar: v.avatar,
      member_oState,
      member_config: v.config,
      member_notification: v.notification,
      
      spaceId: theSpace._id,
      spaceType: theSpace.infoType,
      space_oState,
      space_owner: theSpace.owner,
      space_name: theSpace.name,
      space_avatar: theSpace.avatar,
      space_stateConfig: theSpace.stateConfig,
      space_tagList: theSpace.tagList,
      space_config: theSpace.config,
    }

    list.push(obj)
  }

  return list
}


function getUserName(
  user: Table_User,
  mas: MemberAggSpaces,
) {
  if(mas.name) return mas.name
  const email = user.email ?? ""
  const idx = email.indexOf("@")
  if(idx < 2) return
  return email.substring(0, idx)
}


/*************************** 动态、评论 富文本编辑器相关 ****************************/

/**
 * 将 TipTapJSONContent 格式的数组，转换成纯文本
 * @param list 当前要转换成文本的 TipTapJSONContent[]
 * @param plainText 已转换完毕的文本
 * @param moreText 是否开启更多文字的模式，比如遇到链接，把链接也加载进来。默认为 false，表示关闭
 */
export function listToText(
  list: LiuContent[],
  plainText: string = "",
  parentType?: string,
): string {

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { type, content, text } = v
    if(text) {
      plainText += text
      continue
    }

    if(type === "listItem") {
      if(parentType === "orderedList") {
        plainText += `${i + 1}. `
      }
      else if(parentType === "bulletList") {
        plainText += " · "
      }
    }

    if(content) {
      plainText = listToText(content, plainText, type)
      if(type === "codeBlock") plainText += "\n"
    }

    let addes: LiuNodeType[] = [
      "heading",
      "paragraph",
      "taskList",
      "blockquote", 
      "codeBlock",
      "horizontalRule",
      "listItem",
    ]
    if(type && addes.includes(type as LiuNodeType)) {
      plainText += "\n"
    }

  }

  return plainText
}

export function getSummary(
  content: LiuContent[] | undefined,
) {
  let text = ""
  if(content && content.length > 0) {
    text = listToText(content)
    text = text.replace(/\n/g, " ")
    text = text.trim()
    if(text.length > 140) text = text.substring(0, 140)
    if(text) return text
  }

  return text
}


/********************* 一些 “归一化” 相关的函数 *****************/

/** 检测 val 是否为 email，若是则全转为小写 */
export function isEmailAndNormalize(val: any) {
  const Sch = vbot.string([
    vbot.toTrimmed(),
    vbot.email(),
    vbot.toLowerCase(),
  ])
  const res = vbot.safeParse(Sch, val)
  if(!res.success) return false
  return res.output
}

/** 归一化主题至 LocalTheme */
export function normalizeToLocalTheme(str: any): LocalTheme {
  if(!str || typeof str !== "string") return "system"
  const tmpList: LocalTheme[] = ["light", "dark", "auto", "system"]
  const isInIt = tmpList.includes(str as LocalTheme)
  if(isInIt) return str as LocalTheme
  return "system"
}

/** 归一化语言至 LocalLocale  */
export function normalizeToLocalLocale(str: any): LocalLocale {
  if(!str || typeof str !== "string") return "system"
  const isInIt = supportedLocales.includes(str as SupportedLocale)
  if(isInIt) return str as LocalLocale
  return "system"
}

export function getCharacteristic(
  userAgent: any,
  x_liu_device?: string,
) {
  if(!userAgent || typeof userAgent !== "string") return
  const cha: GetChaRes = {
    isPC: false,
    isMobile: false,
    isWeCom: false,
    isWeChat: false,
    isAlipay: false,
    isDingTalk: false,
    isFeishu: false,
    isUCBrowser: false,
    isQuark: false,
    isIOS: false,
    isIPadOS: false,
    isMac: false,
    isWindows: false,
    isInWebView: false,
    isFirefox: false,
    isSafari: false,
    isChrome: false,
    isEdge: false,
    isHarmonyOS: false,
    isHuaweiBrowser: false,
    isAndroid: false,
  }
  const ua = userAgent.toLowerCase()
  const mobileMatch = userAgent.match(/AppleWebKit.*Mobile.*/)
  
  if(ua.includes("wxwork")) {
    cha.isWeCom = true
    cha.isInWebView = true
  }
  else if(ua.includes("micromessenger")) {
    cha.isWeChat = true
    cha.isInWebView = true
  }
  else if(ua.includes("dingtalk")) {
    cha.isDingTalk = true
    cha.isInWebView = true
  }
  else if(ua.includes("alipayclient")) {
    cha.isAlipay = true
    cha.isInWebView = true
  }
  else if(ua.includes("feishu")) {
    cha.isFeishu = true
    cha.isInWebView = true
  }
  else if(ua.includes("quark")) {
    cha.isQuark = true
  }
  else if(ua.includes("ucbrowser")) {
    cha.isUCBrowser = true
  }

  if(!!mobileMatch) {
    cha.isMobile = true
    cha.isPC = false
  }
  else if(ua.indexOf("mobile") > 1) {
    cha.isMobile = true
    cha.isPC = false
  }
  else {
    cha.isMobile = false
    cha.isPC = true
  }

  if(ua.includes("iphone")) {
    cha.isIOS = true
    cha.isMobile = true
    cha.isPC = false
  }
  if(ua.includes("ios")) {
    cha.isIOS = true
  }
  if(ua.includes("ipod")) {
    cha.isIOS = true
    cha.isMobile = true
    cha.isPC = false
  }
  if(ua.includes("ipad")) {
    cha.isIPadOS = true
    cha.isMobile = true
    cha.isPC = false
  }

  if(ua.includes("macintosh")) {
    cha.isMac = true
  }
  else if(ua.includes("windows")) {
    cha.isWindows = true
  }
  else if(ua.includes("android")) {
    if(!cha.isIOS && !cha.isMac) {
      cha.isAndroid = true
    }
  }

  if(ua.includes("harmonyos")) {
    cha.isHarmonyOS = true
  }
  if(ua.includes("huaweibrowser")) {
    cha.isHuaweiBrowser = true
  }

  // 判别浏览器
  const edg_version_m = ua.match(reg_exp.edge_version)
  if(edg_version_m) {
    // edge browser
    cha.isEdge = true
    cha.isChrome = true
    cha.browserVersion = edg_version_m[1]
  }
  else if(ua.includes("firefox")) {
    cha.isFirefox = true

    const f_version_m = ua.match(reg_exp.firefox_version)
    cha.browserVersion = f_version_m ? f_version_m[1] : undefined
  }
  else if(ua.includes("chrome")) {
    cha.isChrome = true

    const c_version_m = ua.match(reg_exp.chrome_version)
    cha.browserVersion = c_version_m ? c_version_m[1] : undefined
  }
  else if(ua.includes("safari")) {
    if(!ua.includes("android")) {
      cha.isSafari = true

      const s_version_m = ua.match(reg_exp.safari_version)
      cha.browserVersion = s_version_m ? s_version_m[1] : undefined
    }
  }

  if(cha.isIOS && !cha.browserVersion) {
    const ios_version_m = ua.match(reg_exp.ios_version)
    const tmpVersion = ios_version_m ? ios_version_m[1] : undefined
    if(tmpVersion) {
      cha.browserVersion = tmpVersion.replace("_", ".")
    }
  }

  if(x_liu_device) {
    const isIPadOS = x_liu_device.includes("iPadOS")
    if(!cha.isIPadOS && isIPadOS) {
      cha.isIPadOS = true
      cha.isIOS = true
      cha.isMobile = true
      cha.isPC = false
      cha.isMac = false
    }
  }


  return cha
}

// 原则: 应用（浏览器） + 操作系统（设备名）
export function normalizeUserAgent(
  userAgent: any,
  x_liu_device?: string,
) {
  let device = ""
  if(!userAgent || typeof userAgent !== "string") return ""
  const cha = getCharacteristic(userAgent, x_liu_device)
  if(!cha) return ""

  if(cha.isWeCom) {
    
  }
  else if(cha.isWeChat) {
    device += "WeChat, "
  }
  else if(cha.isDingTalk) {
    device += "DingTalk, "
  }
  else if(cha.isAlipay) {
    device += "Alipay, "
  }
  else if(cha.isFeishu) {
    device += "Feishu, "
  }
  else if(cha.isQuark) {
    device += "Quark, "
  }
  else if(cha.isUCBrowser) {
    device += "UCBrowser, "
  }
  else if(cha.isHuaweiBrowser) {
    device += "HuaweiBrowser, "
  }
  else if(cha.isFirefox) {
    device += "Firefox, "
  }
  else if(cha.isEdge) {
    device += "Edge, "
  }
  else if(cha.isChrome) {
    device += "Chrome, "
  }
  else if(cha.isSafari) {
    device += "Safari, "
  }
  
  if(cha.isHarmonyOS) {
    device += "Harmony"
  }
  else if(cha.isIPadOS) {
    device += "iPad"
  }
  else if(cha.isIOS) {
    device += "iPhone"
  }
  else if(cha.isMac) {
    device += "Mac"
  }
  else if(cha.isWindows) {
    device += "Windows"
  }
  else if(cha.isAndroid) {
    device += "Android"
  }
  
  device = device.trim()
  const dLength = device.length
  if(dLength > 2) {
    const lastChat = device[dLength - 1]
    if(lastChat === ",") {
      device = device.substring(0, dLength - 1)
    }
  }
  return device
}

/********************* 一些验证、检查函数 *****************/

/** 指数级访问的检查: 
 * 第 x 次访问，必须与 startedStamp 相差 x^2 秒
 * @param startedStamp 待验证的数据被创建的时间戳
 * @param verifiedNum 不包含本次，已被检查的次数
*/
export function canPassByExponentialDoor(
  startedStamp: number,
  verifiedNum?: number,
) {
  if(!verifiedNum) {
    return { verifiedNum: 1, pass: true }
  }

  verifiedNum++
  
  if(verifiedNum > 8) {
    console.log("try too much. bye bye~")
    return { verifiedNum, pass: false }
  }

  const requiredSec = 3 ** verifiedNum
  const now = getNowStamp()
  const diffSec = (now - startedStamp) / SECONED
  const pass = diffSec > requiredSec
  return { verifiedNum, pass }
}

function getErrMsgFromIssues(issues: vbot.SchemaIssues) {
  const issue = issues?.[0]
  const msg = issue?.message
  return msg ?? "get error from valibot"
}

/** 
 * 检测是否为 images 属于 Cloud_ImageStore[] 类型 
 *  注意: 若 images 是 undefined 返回 true
*/
function isImagesLegal(images?: Cloud_ImageStore[]) {
  const Sch = sch_opt_arr(Sch_Cloud_ImageStore)
  const res = vbot.safeParse(Sch, images)
  return res.success
}

/** 
 * 检测是否为 files 属于 Cloud_FileStore[] 类型 
 *  注意: 若 files 是 undefined 返回 true
*/
function isFilesLegal(files?: Cloud_FileStore[]) {
  const Sch = sch_opt_arr(Sch_Cloud_FileStore)
  const res = vbot.safeParse(Sch, files)
  return res.success
}


// LiuContent 最大嵌套层数
const LIU_CONTENT_NESTING_MAX = 6

/** 检测 liuDesc 是否合法 */
function isLiuContentArr(
  list?: LiuContent[],
  level?: number
) {
  if(!level) level = 1

  if(typeof list === "undefined") return true
  if(!Array.isArray(list)) return false
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const res1 = vbot.safeParse(Sch_Simple_LiuContent, v)
    if(!res1.success) return false
    if(v.content) {
      if(level >= LIU_CONTENT_NESTING_MAX) return false
      const res2 = isLiuContentArr(v.content, level + 1)
      if(!res2) return false
    }
  }
  return true
}

export const checker = {
  getErrMsgFromIssues,
  isImagesLegal,
  isFilesLegal,
  isLiuContentArr,
}


/******************************** 用户相关 ******************************/

/** 给定多个 userData 给出其 userInfos 
 * @param filterMemberLeft 是否过滤掉成员已离开
*/
export async function getUserInfos(
  users: Table_User[],
  filterMemberLeft: boolean = true,
) {
  const userInfos: LiuUserInfo[] = []

  for(let i=0; i<users.length; i++) {
    const v = users[i]
    const userId = v._id

    let m_oState = _.or(_.eq("OK"), _.eq("DEACTIVATED"))
    if(!filterMemberLeft) {
      m_oState = _.or(_.eq("OK"), _.eq("DEACTIVATED"), _.eq("LEFT"))
    }

    // 1. 用 lookup 去查找 member 和 workspace
    const res = await db.collection("Member").aggregate()
      .match({
        user: userId,
        oState: m_oState,
      })
      .sort({
        insertedStamp: 1,
      })
      .lookup({
        from: "Workspace",
        localField: "spaceId",
        foreignField: "_id",
        as: "spaceList",
      })
      .end()
    
    // console.log("看一下 getUserInfos 中聚合搜索的结果: ")
    // console.log(res)
    // console.log(" ")

    const lsams = turnMemberAggsIntoLSAMs(v, res.data, filterMemberLeft)
    if(lsams.length) {
      userInfos.push({ user: v, spaceMemberList: lsams })
    }
  }
  return userInfos
}


/** 获取 token 数据 */
async function _getTokenData(
  token: string,
  serial_id: string,
) {
  const col = db.collection("Token")
  const res = await col.doc(serial_id).get<Table_Token>()
  const d = res.data
  if(!d) return

  // 检查是否过期
  const now = getNowStamp()
  if(now > d.expireStamp) return

  // 检查 token 是否一致
  const _token = d.token
  if(_token !== token) return

  return d 
}

/** 获取 user 数据 */
async function _getUserData(userId: string) {
  const col = db.collection("User")
  const res = await col.doc(userId).get<Table_User>()
  const d = res.data
  if(!d) return
  return d
}

export function getLiuTokenUser() {
  const gShared = cloud.shared
  const map: Map<string, Shared_TokenUser> = gShared.get('liu-token-user') ?? new Map()
  return map
}

export async function getAccountName(
  user: Table_User,
) {
  if(user.email) return user.email
  const userId = user._id
  const mCol = db.collection("Member")
  const w1: Partial<Table_Member> = {
    spaceType: "ME",
    user: userId,
  }
  const res1 = await mCol.where(w1).getOne<Table_Member>()
  const member = res1.data
  if(member?.name) return member.name
  return "no idea"
}


/** 更新 token 数据至 Token 表中 
 *  注意：该函数不会更新缓存
*/
function updateTokenRow(
  id: string,
  partialTokenData: Partial<Table_Token>,
) {
  partialTokenData.updatedStamp = getNowStamp()
  const col = db.collection("Token")
  col.where({ _id: id }).update(partialTokenData)
  return partialTokenData
}

/** 更新 token 数据至全局缓存中 */
function updateTokenCache(
  data: Shared_TokenUser,
  map: Map<string, Shared_TokenUser>,
  gShared: Map<string, any>,
  newTokenData: Table_Token,
) {
  const now = getNowStamp()
  data.tokenData = newTokenData
  data.lastSet = now
  map.set(newTokenData._id, data)
  gShared.set("liu-token-user", map)
}

/** check if the user's subscription is currently active */
export function checkIfUserSubscribed(
  user: Table_User,
) {
  const s = user.subscription
  const isOn = s?.isOn
  if(!s || !isOn) return false
  const isLifelong = s.isLifelong
  if(isLifelong) return true
  const expireStamp = s.expireStamp ?? 1
  const now = getNowStamp()
  const diff = expireStamp - now
  if(diff > 0) return true
  return false
}

/** 插入 token 数据至 Token 表中
 *  并且存到缓存里
 */
export async function insertToken(
  ctx: FunctionContext,
  body: Record<string, string>,
  user: Table_User,
  workspaces: string[],
  client_key?: string,
) {
  // 1. 先存到 Token 表中
  const token = createToken()
  const now = getNowStamp()
  const expireStamp = now + (30 * DAY)
  const basic1 = getBasicStampWhileAdding()
  const platform = body['x_liu_client'] as SupportedClient
  const ip = getIp(ctx)
  const obj1: PartialSth<Table_Token, "_id"> = {
    ...basic1,
    token,
    expireStamp,
    userId: user._id,
    isOn: "Y",
    platform,
    client_key,
    lastRead: now,
    lastSet: now,
    ip,
  }
  const res1 = await db.collection("Token").add(obj1)
  const serial_id = getDocAddId(res1)
  if(!serial_id) return
  const tokenData: Table_Token = { _id: serial_id, ...obj1 }

  // 2. 再存到 shared 中
  const obj2: Shared_TokenUser = {
    token,
    tokenData,
    userData: user,
    workspaces,
    lastSet: now,
  }
  const map = getLiuTokenUser()
  map.set(serial_id, obj2)
  cloud.shared.set("liu-token-user", map) 

  return tokenData
}


/** 验证 token / serial_id
 *   若过程中，发现 user 的 `oState` 不为 `NORMAL`，则不通过；
 *   一切正常，返回 token 和 user 数据。
 */
export async function verifyToken(
  ctx: FunctionContext,
  body: Record<string, string>,
  opt?: VerifyTokenOpt,
): Promise<VerifyTokenRes> {
  const token = body["x_liu_token"]
  const serial_id = body["x_liu_serial"]

  if(!token || !serial_id) {
    return {
      pass: false,
      rqReturn: {
        code: "E4000",
        errMsg: "token, serial_id are required", 
      },
    }
  }

  const gShared = cloud.shared
  const map = getLiuTokenUser()

  const errReturn: LiuRqReturn = { 
    code: "E4003", 
    errMsg: "the verification of token failed",
  }
  const errRes: VerifyTokenRes_A = { pass: false, rqReturn: errReturn }

  let data = map.get(serial_id)
  let tokenData = data?.tokenData
  let userData = data?.userData
  let workspaces = data?.workspaces

  const now1 = getNowStamp()
  const diff1 = now1 - (data?.lastSet ?? 1)

  if(!data || diff1 > MIN_5) {
    // if the cache is not existed
    tokenData = await _getTokenData(token, serial_id)
    if(!tokenData) return errRes
    userData = await _getUserData(tokenData.userId)
    if(!userData) return errRes
    const userInfos = await getUserInfos([userData])
    if(userInfos.length < 1) return errRes
    const uInfo = userInfos[0]
    workspaces = uInfo.spaceMemberList.map(v => v.spaceId)
    data = {
      token,
      tokenData,
      userData,
      workspaces,
      lastSet: getNowStamp(),
    }
    map.set(serial_id, data)
    gShared.set("liu-token-user", map)
  }
  else {
    // if the cache is existed
    if(data.token !== token) return errRes
    if(now1 > data.tokenData.expireStamp) return errRes
  }
  
  if(!data || !tokenData || !userData || !workspaces) return errRes
  if(tokenData.isOn !== "Y") return errRes
  if(userData.oState !== "NORMAL") return errRes

  // 如果当前是 user-login 的 enter 流程
  // 判断要不要刷新 token 和 serial
  let new_token: string | undefined
  let new_serial: string | undefined

  let partialTokenData: Partial<Table_Token> = {}
  let updateRequired = false

  if(opt?.entering) {

    // --------------> 1. 检验 token 的有效期，若快过期去自动延长
    
    const now2 = getNowStamp()

    // 该 token 已经生成多久了
    const diff_1 = now2 - tokenData.insertedStamp

    // 该 token 还有多久过期
    const diff_2 = tokenData.expireStamp - now2

    if(diff_1 > DAY_90) {
      // 若生成时间已大于 90 天，去生成新的 token
      const newTokenData = await insertToken(ctx, body, userData, workspaces, tokenData.client_key)
      if(newTokenData) {

        // 把旧的 token 改成 1 分钟后过期
        const tmpExpireStamp = now2 + MINUTE
        partialTokenData = { expireStamp: tmpExpireStamp }
        updateRequired = true

        // 取出新的 token 和 serial
        new_token = newTokenData.token
        new_serial = newTokenData._id
      }
    }
    else if(diff_2 < DAY_28) {
      // 若在 28 天内过期，则去延长 7 天
      const tmpExpireStamp = tokenData.expireStamp + DAY_7
      partialTokenData = { expireStamp: tmpExpireStamp }
      updateRequired = true
    }

    // --------------> 2. 判断 ip 是否不一致
    const ipGeo = getIpGeo(ctx)
    if(ipGeo && ipGeo !== tokenData.ipGeo) {
      partialTokenData = { ...partialTokenData, ipGeo }
      updateRequired = true
    }

    // --------------> 3. 最后去更新 token
    if(updateRequired) {
      partialTokenData = updateTokenRow(tokenData._id, partialTokenData)
      tokenData = { ...tokenData, ...partialTokenData }
      updateTokenCache(data, map, gShared, tokenData)
    }

  }

  // 检查 tokenData 的 lastSet / lastRead
  tokenData = checkTokenDataLastStamp(data, map, gShared, opt)

  return { 
    pass: true,
    tokenData,
    userData,
    workspaces,
    new_token,
    new_serial,
  }
}

/** 检查 Token 的 isRead isSet 
 * 若超过 10 分钟，就去更新
*/
function checkTokenDataLastStamp(
  data: Shared_TokenUser,
  map: Map<string, Shared_TokenUser>,
  gShared: Map<string, any>,
  opt?: VerifyTokenOpt,
) {
  const entering = opt?.entering
  let isRead = opt?.isRead
  let isSet = opt?.isSet
  if(entering) {
    isRead = true
    isSet = true
  }

  let tokenData = data.tokenData
  if(!isRead && !isSet) return tokenData
  const { lastRead, lastSet } = tokenData
  const now = getNowStamp()
  const MIN_10 = MINUTE * 10
  const diff_read = now - lastRead
  const diff_set = now - lastSet

  let updateRead = false
  let updateSet = false
  if(isRead && diff_read > MIN_10) updateRead = true
  if(isSet && diff_set > MIN_10) updateSet = true
  
  if(!updateRead && !updateSet) return tokenData
  const u: Partial<Table_Token> = {}
  if(updateRead) u.lastRead = now
  if(updateSet) u.lastSet = now

  const serial_id = tokenData._id
  let pTokenData = updateTokenRow(serial_id, u)
  tokenData = { ...tokenData, ...pTokenData }

  // 更新缓存
  updateTokenCache(data, map, gShared, tokenData)

  return tokenData
}


export function updateUserInCache(
  userId: string,
  user?: Table_User,
) {
  const map = getLiuTokenUser()
  let num = 0

  map.forEach((val, key) => {
    const _user_id = val.userData._id
    if(userId !== _user_id) return

    // avoid running in the loop
    if(num > 16) return
    num++

    if(user) {
      val.lastSet = getNowStamp()
      val.userData = user
      map.set(key, val)
    }
    else {
      map.delete(key)
    }

  })

  // 最后不需要再对 cloud.shared 进行 set
  // 因为引用存在时，修改里头的值时，外部的 shared 也会更改
  // 若引用不存在时，代表为空的 map 也不需要更新
}


/********************* Crypto 加解密相关的函数 ****************/

/**
 * 使用 RSA 的密钥解密数据
 * @param encryptedText base64 格式的密文
 */
export function decryptWithRSA(encryptedText: string) {
  const pk = getPrivateKey()
  if(!pk) {
    return { code: "E5001", errMsg: "no private key" }
  }

  const privateKeyObj = crypto.createPrivateKey({
    key: pk,
    format: 'pem',
    type: 'pkcs8',
  })

  const buffer = Buffer.from(encryptedText, "base64")
  
  let plainText = ""
  try {
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKeyObj,
        oaepHash: "SHA256"
      },
      buffer
    )
    plainText = decryptedData.toString('utf8')
  }
  catch(err1) {
    console.warn("解密失败........")
    console.log(err1)
    console.log(" ")
    return { code: "E4003", errMsg: "fail to decrypt" }
  }

  return { plainText }
}

/** 获取 RSA private key */
function getPrivateKey() {
  const keyPair = cloud.shared.get(`liu-rsa-key-pair`)
  const privateKey = keyPair?.privateKey
  if(!privateKey) return undefined
  return privateKey as string
}

/** 获取 RSA public key */
export function getPublicKey() {
  const keyPair = cloud.shared.get(`liu-rsa-key-pair`)
  const publicKey = keyPair?.publicKey
  if(!publicKey) return undefined
  return publicKey as string
}

/** 获取 AES key */
export function getAESKey() {
  const keyPair = cloud.shared.get(`liu-aes-key-iv`)
  const aesKey = keyPair?.aesKey
  if(!aesKey) return undefined
  return aesKey as string
}


/************************** 加解密相关 **********************/

interface GetEncryptedDataRes {
  rqReturn?: LiuRqReturn
  data?: Record<string, any>
}

/** 获取加密后的返回数据 */
export function getEncryptedData(
  oldData: Record<string, any>,
  vRes: VerifyTokenRes_B,
): GetEncryptedDataRes {
  const client_key = vRes.tokenData?.client_key
  const keys = Object.keys(oldData)
  const newData: Record<string, any> = {}

  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    if(!k.startsWith("plz_enc_")) {

      // if newData[plz_enc_${k}] exists, ignore
      const tmpK = `plz_enc_${k}`
      if(newData[tmpK]) continue

      newData[k] = oldData[k]
      continue
    }

    // if client_key is undefined
    const newK = k.replace("plz_enc_", "liu_enc_")
    const originK = newK.replace("liu_enc_", "")

    if(!client_key) {
      // if newData[originK] exists, ignore
      if(newData[originK]) continue
      newData[originK] = oldData[k]
      continue
    }
    
    const val = oldData[k] as CryptoCipherAndIV
    const p1: LiuPlainText = {
      pre: client_key.substring(0, 5),
      nonce: createEncNonce(),
      data: val,
    }
    const p2 = objToStr(p1)
    const newVal = encryptTextWithAES(p2, client_key)
    if(!newVal) {
      return {
        rqReturn: { 
          code: "E4009", 
          errMsg: "encryptTextWithAES failed"
        }
      }
    }
    newData[newK] = newVal

    // delete originK
    if(newData[originK]) {
      delete newData[originK]
    }
    
  }

  return { data: newData }
}


/** 把纯文本用 AES 加密，返回 CryptoCipherAndIV  */
function encryptTextWithAES(
  plainText: string,
  key: string,
) {
  const keyBuffer = Buffer.from(key, "base64")
  const ivBuffer = crypto.randomBytes(16)
  const iv = ivBuffer.toString("base64")

  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, ivBuffer)
  let encrypted = cipher.update(plainText, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  let tag: Buffer
  try {
    tag = cipher.getAuthTag()
  }
  catch(err) {
    console.warn("获取 tag 失败.......")
    console.log(err)
    return
  }
  const encryptedDataWithTag = Buffer.concat([Buffer.from(encrypted, 'base64'), Buffer.from(tag)])
  const cipherText = encryptedDataWithTag.toString("base64")

  const res: CryptoCipherAndIV = {
    cipherText,
    iv,
  }

  return res
}


/** 把任何数据 data 丢进 LiuPlainText，然后转成字符串
 * 再 encryptTextWithAES()
 */
export function encryptDataWithAES(
  data: any,
  key: string,
) {
  if(typeof data === "undefined") return
  const p1: LiuPlainText = {
    pre: key.substring(0, 5),
    nonce: createEncNonce(),
    data,
  }
  const str = objToStr(p1)
  const res = encryptTextWithAES(str, key)
  return res
}


interface GetDecryptedBodyRes {
  rqReturn?: LiuRqReturn
  newBody?: Record<string, any>
}

/** 获取解密后的 body */
export function getDecryptedBody(
  oldBody: Record<string, any>,
  vRes: VerifyTokenRes_B,
): GetDecryptedBodyRes {
  const client_key = vRes.tokenData?.client_key
  if(!client_key) {
    return {
      rqReturn: { 
        code: "E5001", 
        errMsg: "there is no client_key in getDecryptedBody"
      }
    }
  }

  const keys = Object.keys(oldBody)
  const newBody: Record<string, any> = {}
  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    if(!k.startsWith("liu_enc_")) {
      
      // if newBody[k] exists, ignore
      if(newBody[k]) continue

      newBody[k] = oldBody[k]
      continue
    }

    const newK = k.replace("liu_enc_", "")
    const data = oldBody[k] as CryptoCipherAndIV
    const plainText = decryptWithAES(data, client_key)
    if(!plainText) {
      return {
        rqReturn: {
          code: "E4009",
          errMsg: "decryptWithAES failed",
        }
      }
    }

    const obj = strToObj(plainText) as LiuPlainText
    if(!obj) {
      return {
        rqReturn: {
          code: "E4009",
          errMsg: "we cannot parse plain text",
        }
      }
    }
    if(obj.pre !== client_key.substring(0, 5)) {
      return {
        rqReturn: {
          code: "E4009",
          errMsg: "pre is not equal to client_key's first 5 characters",
        }
      }
    }
    newBody[newK] = obj.data
  }

  return { newBody }
}

function decryptWithAES(
  civ: CryptoCipherAndIV,
  key: string,
) {
  const { iv, cipherText } = civ
  const keyBuffer = Buffer.from(key, "base64")
  const ivBuffer = Buffer.from(iv, "base64")

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer)

  // 分割 tag 和 data(密文)
  const tagLength = 16; // 16 字节的 tag 长度
  const encryptedBuffer = Buffer.from(cipherText, 'base64')
  const tag = encryptedBuffer.subarray(encryptedBuffer.length - tagLength)
  const data = encryptedBuffer.subarray(0, encryptedBuffer.length - tagLength)

  try {
    decipher.setAuthTag(tag)
  }
  catch(err) {
    console.warn("setAuthTag 异常......")
    console.log(err)
    console.log(" ")
    return null
  }

  let decrypted = ""
  try {
    decrypted = decipher.update(data, undefined, 'utf8')
    const lastWord = decipher.final('utf-8')
    decrypted += lastWord
  }
  catch(err) {
    console.warn("AES 解密失败.....")
    console.log(err)
    console.log(" ")
    return null
  }

  return decrypted
}

/** decrypt cloud data with AES */
export function decryptCloudData<T>(
  civ?: CryptoCipherAndIV,
): CommonPass<T> {
  if(!civ) return { pass: true }

  const aesKey = getAESKey()
  if(!aesKey) {
    console.warn("aesKey is empty in decryptCloudData")
    return {
      pass: false,
      err: {
        code: "E5001",
        errMsg: "aesKey is empty in decryptCloudData",
      }
    }
  }

  const res = decryptWithAES(civ, aesKey)
  if(!res) {
    console.warn("err occurs in decryptCloudData")
    return {
      pass: false,
      err: {
        code: "E5001",
        errMsg: "decryptWithAES failed in decryptCloudData",
      }
    }
  }
  const res2 = strToObj(res) as LiuPlainText<T>
  const pre = res2.pre
  if(pre !== aesKey.substring(0, 5)) {
    return {
      pass: false,
      err: {
        code: "E5001",
        errMsg: "pre is not matched",
      }
    }
  }
  return { pass: true, data: res2.data }
}

interface EncData {
  enc_title?: CryptoCipherAndIV
  enc_desc?: CryptoCipherAndIV
  enc_images?: CryptoCipherAndIV
  enc_files?: CryptoCipherAndIV
  [key: string]: any
}

interface DecryptEncData_B {
  pass: true
  title?: string
  liuDesc?: LiuContent[]
  images?: Cloud_ImageStore[]
  files?: Cloud_FileStore[]
}

type DecryptEncDataRes = CommonPass_A | DecryptEncData_B

export function decryptEncData(e: EncData): DecryptEncDataRes {

  // title
  const d_title = decryptCloudData<string>(e.enc_title)
  if(!d_title.pass) return d_title
  const title = d_title.data

  // desc
  const d_desc = decryptCloudData<LiuContent[]>(e.enc_desc)
  if(!d_desc.pass) return d_desc
  const liuDesc = d_desc.data

  // images
  const d_images = decryptCloudData<Cloud_ImageStore[]>(e.enc_images)
  if(!d_images.pass) return d_images
  const images = d_images.data

  // files
  const d_files = decryptCloudData<Cloud_FileStore[]>(e.enc_files)
  if(!d_files.pass) return d_files
  const files = d_files.data

  return { pass: true, title, liuDesc, images, files }
}


/************************** ip 查询相关 **********************/

/** 获取 ip 的 ISO 3166-1 代码 */
export function getIpArea(ctx: FunctionContext) {
  const ip = ctx.headers?.['x-real-ip']
  if(!ip || typeof ip !== "string") return
  const geo = geoip.lookup(ip)
  return geo?.country
}

/** 获取 ip 的 ISO 3166-1 & 3166-2 代码 
 *  以 `-` 减号字符进行连接
*/
export function getIpGeo(ctx: FunctionContext) {
  const ip = ctx.headers?.['x-real-ip']
  if(!ip || typeof ip !== "string") return
  const geo = geoip.lookup(ip)
  const c = geo?.country
  if(!c) return
  const r = geo?.region
  if(!r) return c
  return `${c}-${r}`
}


/********************* stripe 相关 ****************/

export class LiuStripe {

  /**
   * stripe 的一些对象中的属性，有时候是 string 的 id 值
   * 有时候则是该属性对象，所以做一个嵌套的方法专门获取其 id
   * @param data 某对象下的属性“值”
   * @return 返回该对象的 id
  */
  static getIdFromStripeObj(data: any) {
    if(!data) return undefined
    if(typeof data === "string") {
      return data
    }
    const id = data?.id
    if(typeof id === "string") {
      return id
    }
  }

  static getStripeInstance() {
    const _env = process.env
    const sk = _env.LIU_STRIPE_API_KEY
    if(!sk) return
    const stripe = new Stripe(sk)
    return stripe
  }

}


/*************** About WeCom ****************/
export async function getWwQynbAccessToken() {
  const col = db.collection("Config")
  const res = await col.getOne<Table_Config>()
  const d = res.data
  const accessToken = d?.wecom_qynb?.access_token
  return accessToken
}

/*************** Functions about wechat starts ****************/
export async function getWeChatAccessToken() {
  const col = db.collection("Config")
  const res = await col.getOne<Table_Config>()
  const d = res.data
  const accessToken = d?.wechat_gzh?.access_token
  return accessToken
}

let wx_gzh_access_token = ""
let lastGetWxGzhAccessTokenStamp = 0
export async function checkAndGetWxGzhAccessToken() {
  if(wx_gzh_access_token) {
    if(isWithinMillis(lastGetWxGzhAccessTokenStamp, MIN_3)) {
      return wx_gzh_access_token
    }
  }

  const res = await getWeChatAccessToken()
  if(!res) {
    console.warn("getWeChatAccessToken fails")
    return ""
  }

  wx_gzh_access_token = res
  lastGetWxGzhAccessTokenStamp = getNowStamp()
  return res
}

export async function getWxGzhUserOAuthAccessToken(
  oauth_code: string,
) {
  const _env = process.env
  const appid = _env.LIU_WX_GZ_APPID
  const appSecret = _env.LIU_WX_GZ_APPSECRET
  if(!appid || !appSecret) {
    return { code: "E5001", errMsg: "no appid or appSecret on backend" }
  }
  const url = new URL(WX_GZH_OAUTH_ACCESS_TOKEN)
  const sp = url.searchParams
  sp.set("appid", appid)
  sp.set("secret", appSecret)
  sp.set("code", oauth_code)
  sp.set("grant_type", "authorization_code")
  const link = url.toString()
  const res3 = await liuReq<Wx_Res_GzhOAuthAccessToken>(link, undefined, { method: "GET" })
  return res3
}

export async function getWxGzhUserInfo(
  wx_gzh_openid: string,
) {
  const url = new URL(API_USER_INFO)
  const sP = url.searchParams
  sP.set("access_token", wx_gzh_access_token)
  sP.set("openid", wx_gzh_openid)
  const link = url.toString()
  const res1 = await liuReq<Wx_Res_GzhUserInfo>(link, undefined, { method: "GET" })
  const data1 = res1.data

  if(!data1) {
    console.warn("there is no userinfo from wx gzh")
    console.log(res1)
  }

  return data1
}

// tag bound user for language
export async function tagWxUserLang(
  wx_gzh_openid: string,
  user: Table_User,
  userInfo?: Wx_Res_GzhUserInfo,
  oldLocale?: SupportedLocale,
) {
  const _env = process.env
  const tagManagement = _env.LIU_WX_GZ_TAG_MANAGEMENT
  if(tagManagement !== "01") {
    console.warn("tag mode is not enabled")
    return
  }

  // 0. get userInfo & check access_token
  const accessToken = await checkAndGetWxGzhAccessToken()
  if(!accessToken) return
  if(!userInfo) {
    userInfo = await getWxGzhUserInfo(wx_gzh_openid)
  }

  // 1. get target tagId
  const locale = getCurrentLocale({ user })
  const tagId = wechat_tag_cfg[locale]


  // 2. if oldLocale exists, untag
  const tags = userInfo?.tagid_list ?? []
  if(oldLocale && oldLocale !== locale) {
    const oldTagId = wechat_tag_cfg[oldLocale]
    const existed2 = tags.includes(oldTagId)
    if(oldTagId && existed2) {
      await untagWxUser(wx_gzh_openid, oldTagId)
    }
  }

  // 3. check if tagId has exists
  const existed3 = tags.includes(tagId)
  if(existed3) {
    return true
  }
  
  // 4. set tag
  const url4 = new URL(API_TAG_USER)
  url4.searchParams.set("access_token", wx_gzh_access_token)
  const link4 = url4.toString()
  const q4 = {
    openid_list: [wx_gzh_openid],
    tagid: tagId,
  }
  const res3 = await liuReq<Wx_Res_Common>(link4, q4)
  const errcode = res3.data?.errcode
  if(errcode !== 0) {
    console.warn("tag user for wechat gzh failed")
    console.log(res3.data)
  }

  return true
}


export async function untagWxUser(
  wx_gzh_openid: string,
  tagid: number,
) {
  const accessToken = await checkAndGetWxGzhAccessToken()
  if(!accessToken) return

  const url = new URL(API_UNTAG_USER)
  url.searchParams.set("access_token", accessToken)
  const link = url.toString()

  const q = {
    openid_list: [wx_gzh_openid],
    tagid,
  }
  const res = await liuReq<Wx_Res_Common>(link, q)
  const errcode = res.data?.errcode
  if(errcode !== 0) {
    console.warn("untag user for wechat gzh failed")
    console.log(res.data)
  }
  return res
}

/*************** Functions about wechat ends ****************/

/*************** Functions about wxpay starts ****************/
export class WxpayHandler {

  static getWxpayReqAuthorization(
    opt: WxpayReqAuthorizationOpt
  ): DataPass<string> {    // this string is just Authorization

    // 1. check out required envs
    if(!wxpay_apiclient_key || !wxpay_apiclient_serial_no) {
      console.warn("no wxpay_apiclient_key or wxpay_apiclient_serial_no")
      return { 
        pass: false,
        err: {
          code: "E5001",
          errMsg: "no wxpay_apiclient_key or wxpay_apiclient_serial_no",
        }
      }
    }

    const { method, path, body } = opt
    const timestamp = Math.floor(getNowStamp() / 1000)
    const nonce = createPaymentNonce()
    let msg = `${method}\n${path}\n${timestamp}\n${nonce}\n`
    if(body) {
      const bodyStr = valTool.objToStr(body)
      msg += `${bodyStr}\n`
    }
    if(method === "GET") {
      msg += "\n"
    }
  
    const tmpSign = crypto.createSign("sha256WithRSAEncryption").update(msg)
    const signature = tmpSign.sign(wxpay_apiclient_key, "base64")
  
    const res2 = this.getMchId()
    if(!res2.pass) return res2
    const wx_mchid = res2.data as string
  
    let reqAuth = `WECHATPAY2-SHA256-RSA2048 `
    reqAuth += `mchid="${wx_mchid}",`
    reqAuth += `nonce_str="${nonce}",`
    reqAuth += `signature="${signature}",`
    reqAuth += `timestamp="${timestamp}",`
    reqAuth += `serial_no="${wxpay_apiclient_serial_no}"`
  
    return { pass: true, data: reqAuth }
  }

  static getWxpayReqHeaders(
    headers: Record<string, string>,
  ) {
    const h = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      ...headers,
    }
    return h
  }

  static decryptResource(
    resource: Wxpay_Resource_Base,
  ) {
    const {
      algorithm,
      nonce,
      associated_data,
      ciphertext,
    } = resource
  
    if(algorithm !== "AEAD_AES_256_GCM") {
      console.warn("algorithm is not supported: ", algorithm)
      return
    }
  
    const api_v3_key = process.env.LIU_WXPAY_API_V3_KEY
    if(!api_v3_key) {
      console.warn("no api_v3_key")
      return
    }
  
    const tagLength = 16
    const encryptedBuffer = Buffer.from(ciphertext, 'base64')
    const tag = encryptedBuffer.subarray(encryptedBuffer.length - tagLength)
    const data = encryptedBuffer.subarray(0, encryptedBuffer.length - tagLength)
  
    const decipher = crypto.createDecipheriv("aes-256-gcm", api_v3_key, nonce)
  
    try {
      decipher.setAuthTag(tag)
      if(typeof associated_data === "string") {
        decipher.setAAD(Buffer.from(associated_data))
      }
    }
    catch(err) {
      console.warn("setAuthTag or setAAD failed")
      console.log(err)
      return
    }
  
    let decrypted = ""
    try {
      decrypted = decipher.update(data, undefined, 'utf8');
    }
    catch(err) {
      console.warn("fail to decrypt with AES 256 GCM")
      console.log(err)
      return
    }
  
    return decrypted
  }

  static getLiuWxpayCert(
    v: Wxpay_Cert_Info,
  ) {
    // 1. process of decrypt
    const decrypted = this.decryptResource(v.encrypt_certificate)
    if(!decrypted) return
  
    // 2. construct LiuWxpayCert
    const obj2: LiuWxpayCert = {
      serial_no: v.serial_no,
      effective_time: v.effective_time,
      expire_time: v.expire_time,
      cert_pem: decrypted,
    }
    
    return obj2
  }


  private static certs: LiuWxpayCert[] = []
  private static lastGetCertsStamp = 0
  private static async getWxpayCerts() {
    const _certs = this.certs
    const stamp = this.lastGetCertsStamp
    if(_certs.length > 0 && isWithinMillis(stamp, MIN_5)) {
      return _certs
    }

    const cCol = db.collection("Config")
    const res = await cCol.getOne<Table_Config>()
    const d = res.data
    const list = d?.wxpay_certs
    if(!list) {
      console.warn("no wxpay certs")
      return []
    }

    this.lastGetCertsStamp = getNowStamp()
    this.certs = list
    return list
  }

  static async verifySign(opt: WxpayVerifySignOpt) {
    // 1. get api_v3_key  
    const api_v3_key = process.env.LIU_WXPAY_API_V3_KEY
    if(!api_v3_key) {
      console.warn("no api_v3_key")
      return false
    }

    // 2. get the specific cert
    const { timestamp, nonce, body, serial, signature } = opt
    const certs = await this.getWxpayCerts()
    const theCert = certs.find(v => v.serial_no === serial)
    if(!theCert) {
      console.warn("no cert found for serial: ", serial)
      return false
    }
    const publicKey = theCert.cert_pem

    // 3. check out stamp
    let stamp = valTool.isStringWithVal(timestamp) ? Number(timestamp) : timestamp
    stamp = stamp * 1000
    const now = getNowStamp()
    const diff3 = Math.abs(now - stamp)
    if(diff3 > MIN_5) {
      console.warn("the timestamp is invalid")
      console.log("now: ", now)
      console.log("stamp: ", stamp)
      return false
    }

    // 4. verify
    const bodystr = typeof body === "string" ? body : objToStr(body)
    const data = `${timestamp}\n${nonce}\n${bodystr}\n`
    try {
      const verifier = crypto.createVerify("RSA-SHA256")
      verifier.update(data)
      const res4 = verifier.verify(publicKey, signature, "base64")
      return res4
    }
    catch(err) {
      console.warn("verify sign failed")
      console.log(err)
    }
    
    return false
  }

  static async verifySignByLiuFetch(
    data: Res_LiuFetch<any> | undefined
  ): Promise<LiuErrReturn | undefined> {

    // 1. check out body
    if(!data) {
      return { code: "E5004", errMsg: "no data" }
    }
    const body = data.text
    if(!body) {
      console.warn("no text of data in verifySignByLiuFetch")
      return { code: "E5004", errMsg: "no body" }
    }

    const h = data.headers

    // 2. get wxchatpay-xxxxx from headers
    const signature = h.get("wechatpay-signature")
    if(!signature) {
      console.warn("no signature in verifySignByLiuFetch")
      return { code: "E5004", errMsg: "no signature" }
    }
    const serial = h.get("wechatpay-serial")
    if(!serial) {
      return { code: "E5004", errMsg: "no serial" }
    }
    const timestamp = h.get("wechatpay-timestamp")
    if(!timestamp) {
      return { code: "E5004", errMsg: "no timestamp" }
    }
    const nonce = h.get("wechatpay-nonce")
    if(!nonce) {
      return { code: "E5004", errMsg: "no nonce" }
    }
    // console.log("signature: ", signature)
    // console.log("serial: ", serial)
    // console.log("timestamp: ", timestamp)
    // console.log("nonce: ", nonce)

    // 3. to verify
    const opt: WxpayVerifySignOpt = {
      signature,
      timestamp,
      nonce,
      body,
      serial,
    }
    const res = await this.verifySign(opt)
    if(!res) {
      return { code: "E4003", errMsg: "verifySign failed" }
    }
  }

  static getMchId(): DataPass<string> {
    const _env = process.env
    const wx_mchid = _env.LIU_WXPAY_MCH_ID as string
    if(!wx_mchid) {
      console.warn("wx_mchid is not set")
      return {
        pass: false,
        err: {
          code: "E5001",
          errMsg: "no wx_mchid",
        }
      }
    }
    return { pass: true, data: wx_mchid }
  }

  // enquire order by out_trade_no
  static async enquireOrderByOutTradeNo(
    out_trade_no: string
  ): Promise<DataPass<Res_Wxpay_Transaction>> {
    // 1. construct path
    const res1 = this.getMchId()
    if(!res1.pass) return { pass: false, err: res1.err }
    const mchId = res1.data
    const path = WXPAY_OUT_TRADE_NO + out_trade_no + `?mchid=${mchId}`
    const url = WXPAY_DOMAIN + path
    const opt2: WxpayReqAuthorizationOpt = {
      method: "GET",
      path,
    }

    // 2. get authorization
    const res2 = this.getWxpayReqAuthorization(opt2)
    if(!res2.pass) return { pass: false, err: res2.err }
    const Authorization = res2.data

    // 3. get headers
    const headers = this.getWxpayReqHeaders({ Authorization })

    // 4. fetch
    const res4 = await liuFetch<Res_Wxpay_Transaction>(url, { headers })
    const data4 = res4.data
    const code4 = res4.code
    if(code4 !== "0000" || !data4) {
      return { pass: false, err: res4 }
    }
    const err4 = await this.verifySignByLiuFetch(data4)
    if(err4) return { pass: false, err: err4 }
    const json4 = data4.json as Res_Wxpay_Transaction

    return { pass: true, data: json4 }
  }

  static async refund(
    param: Wxpay_Refund_Custom_Param,
  ): Promise<DataPass<Res_Wxpay_Refund>> {
    const _env = process.env
    const wxpay_notify_url = _env.LIU_WXPAY_NOTIFY_URL as string

    // 1. construct body
    const b1 = {
      transaction_id: param.transaction_id,
      out_refund_no: param.out_refund_no,
      reason: param.reason,
      notify_url: wxpay_notify_url,
      amount: {
        refund: param.refund_amount,
        total: param.total_amount,
        currency: "CNY",
      }
    }

    // 2. construct Authorization
    const opt2: WxpayReqAuthorizationOpt = {
      method: "POST",
      path: WXPAY_REFUND_PATH,
      body: b1,
    }
    const res2 = this.getWxpayReqAuthorization(opt2)
    if(!res2.pass) return { pass: false, err: res2.err }
    const Authorization = res2.data

    // 3. get headers
    const headers = this.getWxpayReqHeaders({ Authorization })

    // 4. to fetch
    const url = WXPAY_DOMAIN + WXPAY_REFUND_PATH
    const res4 = await liuFetch<Res_Wxpay_Refund>(
      url, 
      { headers, method: "POST" },
      b1,
    )
    const data4 = res4.data
    const code4 = res4.code
    if(code4 !== "0000" || !data4) {
      return { pass: false, err: res4 }
    }

    // 5. verify sign
    const err5 = await this.verifySignByLiuFetch(data4)
    if(err5) return { pass: false, err: err5 }
    const json5 = data4.json as Res_Wxpay_Refund

    return { pass: true, data: json5 }
  }


}
/*************** Functions about wxpay ends ****************/

/*************** Functions about alipay starts ***************/
export class AlipayHandler {
  static getAlipaySdk() {
    const _env = process.env
    const appId = _env.LIU_ALIPAY_APP_ID as string
    const alipaySdk = new AlipaySdk({
      appId,
      privateKey: alipay_cfg.privateKey,
      alipayPublicKey: alipay_cfg.alipayPublicKey,
      keyType: "PKCS8",
    })
    return alipaySdk
  }

  static checkReady(): CommonPass {
    const _env = process.env
    const appId = _env.LIU_ALIPAY_APP_ID
    const privateKey = alipay_cfg.privateKey
    const alipayPublicKey = alipay_cfg.alipayPublicKey
    if(!appId || !privateKey || !alipayPublicKey) {
      console.warn("AlipayHandler.checkReady failed")
      return { pass: false, err: { code: "E5001", errMsg: "no alipay config" } }
    }
    return { pass: true }
  }

  static async refund(
    param: Alipay_Refund_Param,
  ): Promise<DataPass<AlipayCommonResult<Res_Alipay_Refund>>> {
    // 1. init alipay sdk
    const res1 = this.checkReady()
    if(!res1.pass) return res1
    const alipaySdk = this.getAlipaySdk()

    // 2. request to refund
    try {
      const res2 = await alipaySdk.curl<Res_Alipay_Refund>(
        "POST", 
        "/v3/alipay/trade/refund",
        { body: param },
      )
      console.log("AlipayHandler.refund() res2.data: ")
      console.log(res2.data)
      return { pass: true, data: res2 }
    }
    catch(err) {
      console.warn("AlipayHandler.refund() err: ")
      console.log(err)
    }
    return { pass: false, err: { code: "E5003", errMsg: "fail to refund via alipay" } }
  }
}
/*************** Functions about alipay ends ***************/


/*************** About order or payment ***************/
export async function createAvailableOrderId() {
  let num = 0
  let orderId = ""
  const oCol = db.collection("Order")
  while(true) {
    if(num > 3) break

    let tmpId = createOrderId()
    const res = await oCol.where({ order_id: tmpId }).getOne<Table_Order>()
    const rData = res.data
    
    if(!rData) {
      orderId = tmpId
      break
    }

    num++
  }

  return orderId
}

export function extractOrderId(out_trade_no: string) {
  let tmpId = out_trade_no.substring(6)
  if(tmpId.length > 10 && tmpId.startsWith("LD")) {
    return tmpId
  }
}

export function getCurrencySymbol(c: string) {
  const list1 = ["JPY", "CNY"]
  const c2 = c.toUpperCase()
  if(list1.includes(c2)) return "¥"

  const list2 = ["EUR"]
  if(list2.includes(c2)) return "€"

  return "$"
}

// 升级或延长用户订阅
export async function upgrade_user_subscription(
  theOrder: Table_Order,
) {
  // 1. get plan from db
  const plan_id = theOrder.plan_id as string
  const sCol = db.collection("Subscription")
  const res1 = await sCol.doc(plan_id).get<Table_Subscription>()
  const thePlan = res1.data
  if(!thePlan) {
    console.warn("[upgrade_user_subscription] fail to get plan from db")
    return
  }
  
  // 2. get the user
  const user_id = theOrder.user_id
  const uCol = db.collection("User")
  const res2 = await uCol.doc(user_id).get<Table_User>()
  const theUser = res2.data
  if(!theUser) {
    console.warn("[upgrade_user_subscription] fail to get user from db")
    return
  }

  // 3. check out chargedStamp to avoid duplicate charging
  const oldUserSub = theUser.subscription
  const chargedStamp = oldUserSub?.chargedStamp ?? 1
  const now3 = getNowStamp()
  const diff3 = now3 - chargedStamp
  if(diff3 < SEC_5) {
    console.warn("the user has been charged in the past 5 seconds")
    return
  }

  // 3.2 reset quota
  const quota = theUser.quota
  if(quota) {
    quota.aiConversationCount = 0
  }
  
  // 4. generate a new subscription in user
  let chargeTimes = oldUserSub?.chargeTimes ?? 0
  chargeTimes += 1
  const newUserSub: UserSubscription = {
    isOn: "Y",
    plan: plan_id,
    isLifelong: oldUserSub?.isLifelong ?? false,
    autoRecharge: false,
    createdStamp: oldUserSub?.createdStamp ?? now3,
    chargedStamp: now3,
    firstChargedStamp: oldUserSub?.firstChargedStamp ?? now3,
    chargeTimes,
  }
  if(!newUserSub.isLifelong) {
    const newExpireStamp = LiuDateUtil.getNewExpireStamp(
      thePlan.payment_circle,
      theOrder.meta_data?.payment_timezone,
      oldUserSub?.expireStamp,
    )
    newUserSub.expireStamp = newExpireStamp
  }

  // 5. update user's subscription
  console.log("newUserSub: ")
  console.log(newUserSub)
  console.log("quota: ")
  console.log(quota)

  const u5: Partial<Table_User> = {
    subscription: newUserSub,
    quota,
    updatedStamp: now3,
  }
  const res5 = await uCol.doc(user_id).update(u5)
  const newUser: Table_User = { ...theUser, ...u5 }
  updateUserInCache(user_id, newUser)
}
