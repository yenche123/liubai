// liu-env 请不要 import 任何 /src 内的文件
// 因为它会在非常非常早期被初始化
// 若引入其他东西，可能触发 Unaught ReferenceError
import { type LiuSystemEnv } from "./types"

let _env: LiuSystemEnv | undefined

function getEnv(): LiuSystemEnv {
  if(_env) return _env

  const DEV = import.meta.env.DEV
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN
  const APP_NAME = import.meta.env.VITE_APP_NAME

  // payment priority
  const PAYMENT_PRIORITY = import.meta.env.VITE_PAYMENT_PRIORITY

  // debug btn
  const VITE_DEBUG_BTN = import.meta.env.VITE_DEBUG_BTN
  const DEBUG_BTN = VITE_DEBUG_BTN === "01"

  // SaaS 各个服务情况上限
  const LOCAL_PIN_NUM = import.meta.env.VITE_LOCAL_PIN_NUM
  const FREE_PIN_NUM = import.meta.env.VITE_FREE_PIN_NUM
  const PREMIUM_PIN_NUM = import.meta.env.VITE_PREMIUM_PIN_NUM
  const FREE_THREAD_NUM = import.meta.env.VITE_FREE_THREAD_NUM
  const LOCAL_WORKSPACE_NUM = import.meta.env.VITE_LOCAL_WORKSPACE_NUM
  const FREE_WORKSPACE_NUM = import.meta.env.VITE_FREE_WORKSPACE_NUM
  const PREMIUM_WORKSPACE_NUM = import.meta.env.VITE_PREMIUM_WORKSPACE_NUM
  const LOCAL_THREAD_IMG_NUM = import.meta.env.VITE_LOCAL_THREAD_IMG_NUM
  const FREE_THREAD_IMG_NUM = import.meta.env.VITE_FREE_THREAD_IMG_NUM
  const PREMIUM_THREAD_IMG_NUM = import.meta.env.VITE_PREMIUM_THREAD_IMG_NUM
  const LOCAL_COMMENT_IMG_NUM = import.meta.env.VITE_LOCAL_COMMENT_IMG_NUM
  const FREE_COMMENT_IMG_NUM = import.meta.env.VITE_FREE_COMMENT_IMG_NUM
  const PREMIUM_COMMENT_IMG_NUM = import.meta.env.VITE_PREMIUM_COMMENT_IMG_NUM
  const LOCAL_FILE_MB = import.meta.env.VITE_LOCAL_FILE_MB
  const FREE_FILE_MB = import.meta.env.VITE_FREE_FILE_MB
  const PREMIUM_FILE_MB = import.meta.env.VITE_PREMIUM_FILE_MB

  // i18n
  const FALLBACK_LOCALE = import.meta.env.VITE_FALLBACK_LOCALE

  // 系统设置
  const OPEN_WITH_BROWSER = import.meta.env.VITE_OPEN_WITH_BROWSER
  const REMOVING_DAYS = import.meta.env.VITE_REMOVING_DAYS
  const DELETING_DAYS = import.meta.env.VITE_DELETING_DAYS

  // rules
  const SERVICE_TERMS_LINK = import.meta.env.VITE_SERVICE_TERMS_LINK
  const PRIVACY_POLICY_LINK = import.meta.env.VITE_PRIVACY_POLICY_LINK

  // sentry
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
  const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT

  // umami
  const UMAMI_SCRIPT = import.meta.env.VITE_UMAMI_SCRIPT
  const UMAMI_ID = import.meta.env.VITE_UMAMI_ID

  // clarity
  const MS_CLARITY_SCRIPT = import.meta.env.VITE_MS_CLARITY_SCRIPT
  const MS_CLARITY_PROJECT_ID = import.meta.env.VITE_MS_CLARITY_PROJECT_ID

  // bugfender
  const BUGFENDER_APIURL = import.meta.env.VITE_BUGFENDER_APIURL
  const BUGFENDER_BASEURL = import.meta.env.VITE_BUGFENDER_BASEURL
  const BUGFENDER_APPKEY = import.meta.env.VITE_BUGFENDER_APPKEY

  // openpanel
  const OPENPANEL_API_URL = import.meta.env.VITE_OPENPANEL_API_URL
  const OPENPANEL_CLIENT_ID = import.meta.env.VITE_OPENPANEL_CLIENT_ID
  const OPENPANEL_CLIENT_SECRET = import.meta.env.VITE_OPENPANEL_CLIENT_SECRET

  // posthog
  const POSTHOG_APIHOST = import.meta.env.VITE_POSTHOG_APIHOST
  const POSTHOG_APIKEY = import.meta.env.VITE_POSTHOG_APIKEY

  // cloudflare web analytics
  const CF_WEB_ANALYTICS_SRC = import.meta.env.VITE_CF_WEB_ANALYTICS_SRC
  const CF_WEB_ANALYTICS_TOKEN = import.meta.env.VITE_CF_WEB_ANALYTICS_TOKEN
  const CF_WEB_ANALYTICS_SENDTO = import.meta.env.VITE_CF_WEB_ANALYTICS_SENDTO

  // plausible
  const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN
  const PLAUSIBLE_SRC = import.meta.env.VITE_PLAUSIBLE_SRC

  // openreplay
  const OPENREPLAY_PROJECT_KEY = import.meta.env.VITE_OPENREPLAY_PROJECT_KEY
  const OPENREPLAY_INGEST_POINT = import.meta.env.VITE_OPENREPLAY_INGEST_POINT

  // goatcounter
  const GOATCOUNTER_DATA = import.meta.env.VITE_GOATCOUNTER_DATA
  const GOATCOUNTER_SRC = import.meta.env.VITE_GOATCOUNTER_SRC

  // tinylytics
  const TINYLYTICS_SRC = import.meta.env.VITE_TINYLYTICS_SRC

  // customer service link
  const CUSTOMER_SERVICE = import.meta.env.VITE_CUSTOMER_SERVICE
  const WECOM_GROUP_LINK = import.meta.env.VITE_WECOM_GROUP_LINK

  // connectors
  const CONNECTORS = import.meta.env.VITE_CONNECTORS === "01"
  const C_WECHAT = import.meta.env.VITE_CONNECT_WECHAT === "01"
  const C_DINGTALK = import.meta.env.VITE_CONNECT_DINGTALK === "01"
  const C_FEISHU = import.meta.env.VITE_CONNECT_FEISHU === "01"
  const C_TELEGRAM = import.meta.env.VITE_CONNECT_TELEGRAM === "01"
  const C_WHATSAPP = import.meta.env.VITE_CONNECT_WHATSAPP === "01"
  const C_LINE = import.meta.env.VITE_CONNECT_LINE === "01"
  const C_TEAMS = import.meta.env.VITE_CONNECT_TEAMS === "01"
  const C_SLACK = import.meta.env.VITE_CONNECT_SLACK === "01"
  const NOTIFICATION_PRIORITY = import.meta.env.VITE_NOTIFICATION_PRIORITY

  // do not use sync system even if API_DOMAIN is set
  const donotUseSync = import.meta.env.VITE_DONOT_USE_SYNC
  const DONOT_USE_SYNC = donotUseSync === "01"

  // login ways
  const loginWays = import.meta.env.VITE_LOGIN_WAYS
  const LOGIN_WAYS = loginWays ? loginWays.split(",") : []

  // other
  const phoneBoundRequired = import.meta.env.VITE_PHONE_BOUND_REQUIRED
  const PHONE_BOUND_REQUIRED = phoneBoundRequired === "01"

  _env = {
    DEV,
    API_DOMAIN,
    APP_NAME,
    PAYMENT_PRIORITY,
    DEBUG_BTN,
    LOCAL_PIN_NUM: Number(LOCAL_PIN_NUM),
    FREE_PIN_NUM: Number(FREE_PIN_NUM),
    PREMIUM_PIN_NUM: Number(PREMIUM_PIN_NUM),
    FREE_THREAD_NUM: Number(FREE_THREAD_NUM),
    LOCAL_WORKSPACE_NUM: Number(LOCAL_WORKSPACE_NUM),
    FREE_WORKSPACE_NUM: Number(FREE_WORKSPACE_NUM),
    PREMIUM_WORKSPACE_NUM: Number(PREMIUM_WORKSPACE_NUM),
    LOCAL_THREAD_IMG_NUM: Number(LOCAL_THREAD_IMG_NUM),
    FREE_THREAD_IMG_NUM: Number(FREE_THREAD_IMG_NUM),
    PREMIUM_THREAD_IMG_NUM: Number(PREMIUM_THREAD_IMG_NUM),
    LOCAL_COMMENT_IMG_NUM: Number(LOCAL_COMMENT_IMG_NUM),
    FREE_COMMENT_IMG_NUM: Number(FREE_COMMENT_IMG_NUM),
    PREMIUM_COMMENT_IMG_NUM: Number(PREMIUM_COMMENT_IMG_NUM),
    LOCAL_FILE_MB: Number(LOCAL_FILE_MB),
    FREE_FILE_MB: Number(FREE_FILE_MB),
    PREMIUM_FILE_MB: Number(PREMIUM_FILE_MB),
    FALLBACK_LOCALE,
    OPEN_WITH_BROWSER: OPEN_WITH_BROWSER === "01",
    REMOVING_DAYS: Number(REMOVING_DAYS),
    DELETING_DAYS: Number(DELETING_DAYS),
    SERVICE_TERMS_LINK,
    PRIVACY_POLICY_LINK,
    SENTRY_DSN,
    SENTRY_ENVIRONMENT,
    UMAMI_SCRIPT,
    UMAMI_ID,
    MS_CLARITY_SCRIPT,
    MS_CLARITY_PROJECT_ID,
    BUGFENDER_APIURL,
    BUGFENDER_BASEURL,
    BUGFENDER_APPKEY,
    OPENPANEL_API_URL,
    OPENPANEL_CLIENT_ID,
    OPENPANEL_CLIENT_SECRET,
    POSTHOG_APIHOST,
    POSTHOG_APIKEY,
    CF_WEB_ANALYTICS_SRC,
    CF_WEB_ANALYTICS_TOKEN,
    CF_WEB_ANALYTICS_SENDTO,
    PLAUSIBLE_DOMAIN,
    PLAUSIBLE_SRC,
    OPENREPLAY_PROJECT_KEY,
    OPENREPLAY_INGEST_POINT,
    GOATCOUNTER_DATA,
    GOATCOUNTER_SRC,
    TINYLYTICS_SRC,
    CUSTOMER_SERVICE,
    WECOM_GROUP_LINK,
    CONNECTORS,
    C_WECHAT,
    C_DINGTALK,
    C_FEISHU,
    C_TELEGRAM,
    C_WHATSAPP,
    C_LINE,
    C_TEAMS,
    C_SLACK,
    NOTIFICATION_PRIORITY,
    DONOT_USE_SYNC,
    LOGIN_WAYS,
    PHONE_BOUND_REQUIRED,
  }
  return _env
}

let backendExisted: boolean | undefined
function hasBackend() {
  if(typeof backendExisted === "boolean") return backendExisted
  const env = getEnv()
  backendExisted = Boolean(env.API_DOMAIN)
  return backendExisted
}

function canISync() {
  const be = hasBackend()
  if(!be) return false
  const env = getEnv()
  if(env.DONOT_USE_SYNC) return false
  return true
}



export default {
  getEnv,
  hasBackend,
  canISync,
}