


export interface LiuSystemEnv {
  DEV: boolean

  API_URL?: string
  API_DOMAIN?: string
  APP_NAME?: string

  LOCAL_PIN_NUM: number
  FREE_PIN_NUM: number
  PREMIUM_PIN_NUM: number

  FREE_THREAD_NUM: number

  LOCAL_WORKSPACE_NUM: number
  FREE_WORKSPACE_NUM: number
  PREMIUM_WORKSPACE_NUM: number

  LOCAL_THREAD_IMG_NUM: number
  FREE_THREAD_IMG_NUM: number
  PREMIUM_THREAD_IMG_NUM: number

  LOCAL_COMMENT_IMG_NUM: number
  FREE_COMMENT_IMG_NUM: number
  PREMIUM_COMMENT_IMG_NUM: number

  FALLBACK_LOCALE: string

  REMOVING_DAYS: number
  DELETING_DAYS: number

  IFRAME_PROXY?: string
  IFRAME_PROXY_KEY?: string
}