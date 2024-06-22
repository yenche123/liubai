

export interface LiuSystemEnv {
  DEV: boolean

  API_DOMAIN?: string
  APP_NAME?: string

  DEBUG_BTN?: boolean

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

  // sentry
  SENTRY_DSN?: string
  SENTRY_ENVIRONMENT?: string

  // umami
  UMAMI_SCRIPT?: string
  UMAMI_ID?: string

  // clarity
  MS_CLARITY_SCRIPT?: string
  MS_CLARITY_PROJECT_ID?: string

  // bugfender
  BUGFENDER_APIURL?: string
  BUGFENDER_BASEURL?: string
  BUGFENDER_APPKEY?: string

  // OpenPanel
  OPENPANEL_API?: string
  OPENPANEL_CLIENT_ID?: string
  OPENPANEL_CLIENT_SECRET?: string

  // posthog
  POSTHOG_APIHOST?: string
  POSTHOG_APIKEY?: string

  // cloudflare web analytics
  CF_WEB_ANALYTICS_SRC?: string
  CF_WEB_ANALYTICS_TOKEN?: string
  CF_WEB_ANALYTICS_SENDTO?: string

  // plausible
  PLAUSIBLE_DOMAIN?: string
  PLAUSIBLE_SRC?: string

  // matomo
  MATOMO_URL?: string

  // don't use sync-system
  DONOT_USE_SYNC?: boolean

}