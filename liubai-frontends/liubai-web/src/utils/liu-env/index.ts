// liu-env 请不要 import 任何 /src 内的文件
// 因为它会在非常非常早期被初始化
// 若引入其他东西，可能触发 Unaught ReferenceError

function getEnv() {
  const DEV = import.meta.env.DEV
  const API_URL = import.meta.env.VITE_API_URL

  const APP_NAME = import.meta.env.VITE_APP_NAME

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

  // i18n
  const FALLBACK_LOCALE = import.meta.env.VITE_FALLBACK_LOCALE

  // 系统设置
  const REMOVING_DAYS = import.meta.env.VITE_REMOVING_DAYS
  const DELETING_DAYS = import.meta.env.VITE_DELETING_DAYS

  // iframe proxy
  const IFRAME_PROXY = import.meta.env.VITE_IFRAME_PROXY
  const IFRAME_PROXY_KEY = import.meta.env.VITE_IFRAME_PROXY_KEY

  return {
    DEV,
    API_URL,
    APP_NAME,
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
    FALLBACK_LOCALE,
    REMOVING_DAYS: Number(REMOVING_DAYS),
    DELETING_DAYS: Number(DELETING_DAYS),
    IFRAME_PROXY,
    IFRAME_PROXY_KEY,
  }
}

/** 从环境变量里判断，是否具备后端的配置，若无，则为纯本地应用 */
function getIfPurelyLocal() {
  const env = getEnv()
  if(!env.API_URL) return true
  return false
}

export default {
  getEnv,
  getIfPurelyLocal,
}