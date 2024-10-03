// 存放所有接口返回的 data 类型
import type { LocalTheme } from "~/types/types-atom"
import type { LocalLocale } from "~/types/types-locale"
import type { 
  OState_Order,
  OrderStatus,
  PayChannel,
  OrderType,
  UserSubscription, 
  LiuSpaceAndMember, 
  SubscriptionStripe,
  SubscriptionPaymentCircle,
  CloudStorageService,
  SubscriptionWxpay,
  SubscriptionAlipay,
  Wxpay_Jsapi_Params,
} from "~/types/types-cloud"


/********************** Hello World *******************/
export interface Res_HelloWorld {
  stamp: number
}


/************************ 登录相关 ********************/

export interface Res_UserLoginInit {
  publicKey?: string
  githubOAuthClientId?: string
  googleOAuthClientId?: string
  wxGzhAppid?: string
  state?: string
}

export interface Res_ULN_User extends LiuSpaceAndMember {
  userId: string
  createdStamp: number
}

export interface Res_UL_WxGzhScan {
  operateType: "wx_gzh_scan"
  qr_code: string
  credential: string
}

export interface Res_UL_WxGzhBase {
  operateType: "wx_gzh_base"
  wx_gzh_openid: string
}

export interface Res_UL_ScanCheck {
  operateType: "scan_check"
  status: CheckBindStatus
  credential_2?: string     // 当 status 为 "plz_check" 时，必有
}

export interface Res_UserLoginNormal {

  // 需要验证 email 时或只有一个 user 符合时
  email?: string

  // 只有一个 user 符合时
  open_id?: string
  github_id?: number
  theme?: LocalTheme
  language?: LocalLocale
  // 返回的 space 和 member 信息都是当前用户有加入的，已退出的不会返回
  spaceMemberList?: LiuSpaceAndMember[]
  subscription?: UserSubscription
  serial_id?: string
  token?: string
  userId?: string

  // 有多个 user 符合时
  multi_users?: Res_ULN_User[]
  multi_credential?: string
  multi_credential_id?: string
}

/************************ 用户信息 (包含会员信息) ********************/

export interface Res_UserSettings_Enter {
  email?: string
  github_id?: number
  open_id?: string
  theme: LocalTheme
  language: LocalLocale
  spaceMemberList: LiuSpaceAndMember[]
  subscription?: UserSubscription
  new_serial?: string
  new_token?: string
}

export type Res_UserSettings_Latest = 
  Omit<Res_UserSettings_Enter, "new_serial" | "new_token">

export interface Res_UserSettings_Membership {
  subscription?: UserSubscription
}

/************************ About Subscription ********************/

export interface Res_SubPlan_Info {
  id: string
  payment_circle: SubscriptionPaymentCircle
  badge: string
  title: string
  desc: string
  stripe?: SubscriptionStripe
  wxpay?: SubscriptionWxpay
  alipay?: SubscriptionAlipay

  // 以下价格是向用户在前端展示的价格，请使用用户能理解的常用单位
  // 而非最终收费的单位
  price: string
  currency: string   // 三位英文大写字符组成
  symbol: string     // 货币符号，比如 "¥"
}

export interface Res_SubPlan_StripeCheckout {
  checkout_url: string
}

/************************ payment-order ********************/
export interface Param_PaymentOrder_A {
  operateType: "create_order"
  subscription_id: string
}

export interface Param_PaymentOrder_B {
  operateType: "get_order"
  order_id: string
}

export interface Param_PaymentOrder_C {
  operateType: "wxpay_jsapi"
  order_id: string
  wx_gzh_openid: string
}


export interface Res_OrderData {
  order_id: string
  oState: OState_Order
  orderStatus: OrderStatus
  orderAmount: number
  paidAmount: number
  currency: string          // 三位英文 “小写” 字符组成
  symbol: string
  refundedAmount: number
  payChannel?: PayChannel
  orderType: OrderType
  plan_id?: string
  product_id?: string
  expireStamp?: number
  tradedStamp?: number
  insertedStamp: number
  canPay: boolean
  title?: string
}

export interface Res_PO_CreateOrder {
  operateType: "create_order"
  orderData: Res_OrderData
}

export interface Res_PO_GetOrder {
  operateType: "get_order"
  orderData: Res_OrderData
}

export interface Res_PO_WxpayJsapi {
  operateType: "wxpay_jsapi"
  param: Wxpay_Jsapi_Params
}

export interface Res_PO_AlipayWap {
  operateType: "alipay_wap"
  wap_url: string
}


/************************ Uploading File ********************/

export interface Res_FileSet_UploadToken {
  cloudService: CloudStorageService
  uploadToken: string
  prefix: string
}

/************************ Webhook ********************/

export interface Res_WebhookQiniu {
  cloud_url: string
}


/************************ Open System ********************/

/*************** open-connect **************/
export type OpenConnectOperate = "bind-wecom" | "check-wecom" | "get-wechat"
  | "set-wechat" | "bind-wechat" | "check-wechat"

export type CheckBindStatus = "waiting" | "plz_check" | "expired"

export interface Res_OC_BindWeCom {
  operateType: "bind-wecom"
  pic_url: string
  credential: string
}

export interface Res_OC_CheckWeCom {
  operateType: "check-wecom"
  status: CheckBindStatus
}

export interface Res_OC_BindWeChat {
  operateType: "bind-wechat"
  qr_code: string
  credential: string
}

export interface Res_OC_CheckWeChat {
  operateType: "check-wechat"
  status: CheckBindStatus
}

export interface Res_OC_GetWeChat {
  operateType: "get-wechat"
  ww_qynb_external_userid?: string
  ww_qynb_toggle?: boolean
  wx_gzh_openid?: string
  wx_gzh_toggle?: boolean
  wx_gzh_subscribed?: boolean
}