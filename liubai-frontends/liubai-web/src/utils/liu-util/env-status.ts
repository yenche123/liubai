


export function getEnv() {
  const DEV = import.meta.env.DEV
  const API_URL = import.meta.env.VITE_API_URL

  const APP_NAME = import.meta.env.VITE_APP_NAME
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
  }
}

/** 从环境变量里判断，是否具备后端的配置，若无，则为纯本地应用 */
export function getIfPurelyLocal() {
  const env = getEnv()
  if(!env.API_URL) return true
  return false
}