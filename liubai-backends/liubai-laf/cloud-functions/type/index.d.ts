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
      LIU_QINIU_CALLBACK_URL?: string

    }
  }
}