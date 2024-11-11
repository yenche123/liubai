import { 
  FunctionContext as _FunctionContext
} from "@lafjs/cloud"
import { ObjectId as _ObjectId } from "mongodb"

type LiuSwitch = "01" | "02" | undefined

declare global {
  type FunctionContext = _FunctionContext

  class ObjectId extends _ObjectId {}
  
  namespace NodeJS {
    interface ProcessEnv {

      /** 由 Laf 所定义的字段 */
      APPID: string

      /** 应用名称，请以英文字母开头，并且为 \w */
      LIU_APP_NAME: string

      /** 总服务状态，默认开启，仅当值为 `02` 时关闭 */
      LIU_CLOUD_ON: LiuSwitch

      /** 是否开放登录，默认开启，仅当值为 `02` 时关闭，`03` 时表示仅开放 
       *  登录，不开放注册
      */
      LIU_CLOUD_LOGIN: LiuSwitch | "03"

      /** 当前应用的域名 
       *  其结尾请不要添加路径的开头 `/`
      */
      LIU_DOMAIN?: string

      /** 内部 debug 时，通行码 */
      LIU_DEBUG_KEY?: string

      /** 兜底的语言信息，若该字段不存在，系统会使用 'en' 做兜底 */
      LIU_FALLBACK_LOCALE?: string

      /** 默认时区，比如 "8.5" 就是东 8.5 时区 */
      LIU_TIMEZONE?: string
      LIU_CURRENCY?: string   // 默认货币单位（兜底用，大写）
                              // 比如 "CNY" / "USD" / "HKD" / "EUR" / "JPY" / "TWD" / "NZD" / "AUD"

      /** email */
      LIU_EMAIL_1?: string           // 商务合作
      LIU_EMAIL_FOR_REPLY?: string   // 用户回复 noreply 时回复到哪个邮箱地址
      LIU_EMAIL_SEND_CHANNEL?: "resend" | "tencent-ses"    // 必须与 LiuSESChannel 一致

      /** GitHub OAuth */
      LIU_GITHUB_OAUTH_CLIENT_ID?: string
      LIU_GITHUB_OAUTH_CLIENT_SECRET?: string

      /** Google OAuth Web 端 */
      LIU_GOOGLE_OAUTH_CLIENT_ID?: string
      LIU_GOOGLE_OAUTH_CLIENT_SECRET?: string

      /** Resend */
      LIU_RESEND_API_KEY?: string
      LIU_RESEND_FROM_EMAIL?: string     // 发送的 email 地址

      /** Stripe */
      LIU_STRIPE_API_KEY?: string        // stripe 的 api key
      LIU_STRIPE_ENDPOINT_SECRET?: string  // stripe 的 webhook secret
      LIU_STRIPE_TEST_PRICE_ID?: string    // stripe 测试用的 price id

      /** 七牛 */
      LIU_QINIU_ACCESS_KEY?: string
      LIU_QINIU_SECRET_KEY?: string
      LIU_QINIU_BUCKET?: string           // 七牛云的目标桶名称
      LIU_QINIU_FOLDER?: string           // 目标桶下的文件夹，不要加斜杠，默认为 users
      LIU_QINIU_THIRD_FOLDER?: string     // 服务端转存第三方文件的文件夹，不要加斜杠，默认为 third
      LIU_QINIU_CALLBACK_URL?: string
      LIU_QINIU_CDN_DOMAIN?: string       // 七牛云的 cdn 域名，结尾不要加 /
      LIU_QINIU_CUSTOM_KEY?: string       // 自定义密钥，用于在 webhook-qiniu 中验证使用

      /** 微信公众号 */
      LIU_WX_GZ_APPID?: string
      LIU_WX_GZ_APPSECRET?: string
      LIU_WX_GZ_TOKEN?: string
      LIU_WX_GZ_ENCODING_AESKEY?: string
      LIU_WX_GZ_TAG_MANAGEMENT?: string    // 01: tag management enabled, otherwise disabled
      LIU_WX_GZ_LOGIN?: string             // 01: logging in by wx gzh enabled, otherwise disabled
      LIU_WX_GZ_TMPL_ID_1?: string         // reminder template id enabled, otherwise disabled
      LIU_WX_GZ_TEST_OPENID?: string       // test openid of wx_gzh for testing ai

      /** 企业微信 企业内部自建应用 */
      LIU_WECOM_QYNB_CORPID?: string
      LIU_WECOM_QYNB_AGENTID?: string
      LIU_WECOM_QYNB_SECRET?: string
      LIU_WECOM_QYNB_TOKEN?: string
      LIU_WECOM_QYNB_ENCODING_AESKEY?: string
      LIU_WECOM_QYNB_BOT_IDS?: string    // wecom's userIds where these wecom users
                                         // can send & receive messages via our backend
                                         // plz use comma（,） to split
      // 企业微信 会话内容存档
      LIU_WECOM_CHAT_SYNC_TOKEN?: string
      LIU_WECOM_CHAT_SYNC_ENCODING_AESKEY?: string

      // 微信支付
      LIU_WXPAY_MCH_ID?: string
      LIU_WXPAY_NOTIFY_URL?: string       // callback url from wxpay
      LIU_WXPAY_API_V3_KEY?: string       // api v3 key

      // 腾讯云
      LIU_TENCENTCLOUD_SECRET_ID?: string    // 腾讯云的 secret id
      LIU_TENCENTCLOUD_SECRET_KEY?: string   // 腾讯云的 secret key

      // 腾讯云 SES
      LIU_TENCENT_SES_REGION?: string        // 腾讯云 SES 所属的地域，有值 "ap-guangzhou" / "ap-hongkong"
      LIU_TENCENT_SES_FROM_EMAIL?: string    // 腾讯云 SES 的发件邮箱

      // 支付宝
      LIU_ALIPAY_APP_ID?: string
      LIU_ALIPAY_NOTIFY_URL?: string

      /** LLMs */
      LIU_DEEPSEEK_BASE_URL?: string         // DeepSeek AI 的 base url
      LIU_DEEPSEEK_API_KEY?: string          // DeepSeek AI 的 api key
      LIU_MOONSHOT_BASE_URL?: string         // Moonshot AI 的 base url
      LIU_MOONSHOT_API_KEY?: string          // Moonshot AI 的 api key
      LIU_STEPFUN_BASE_URL?: string          // Stepfun AI 的 base url
      LIU_STEPFUN_API_KEY?: string           // Stepfun AI 的 api key
      LIU_YI_BASE_URL?: string               // 01.ai 的 base url
      LIU_YI_API_KEY?: string                // 01.ai 的 api key
      LIU_ZHIPU_BASE_URL?: string            // 智谱的 base url
      LIU_ZHIPU_API_KEY?: string             // 智谱的 api key

      /** Characters */
      LIU_WXGZH_KF_DEEPSEEK?: string         // kf_account of deepseek
      LIU_WXGZH_KF_KIMI?: string             // kf_account of kimi
      LIU_WXGZH_KF_WANZHI?: string           // kf_account of wanzhi
      LIU_WXGZH_KF_YUEWEN?: string           // kf_account of yuewen
      LIU_WXGZH_KF_ZHIPU?: string            // kf_account of zhipu

    }
  }
}