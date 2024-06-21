import liuEnv from "../../liu-env";

const getSentry = async () => {
  const Sentry = await import("@sentry/vue")
  return Sentry
}

const getBugfender = async () => {
  const Bugfender = await import("@bugfender/sdk")
  return Bugfender
}

const getPostHog = async () => {
  const { posthog } = await import("posthog-js")
  return posthog
}

const isSentryExisted = () => {
  const _env = liuEnv.getEnv()
  const dsn = _env.SENTRY_DSN
  return Boolean(dsn)
}

const isBugfenderExisted = () => {
  const _env = liuEnv.getEnv()
  const {
    BUGFENDER_APIURL: apiURL,
    BUGFENDER_BASEURL: baseURL,
    BUGFENDER_APPKEY: appKey,
  } = _env
  if(!apiURL || !baseURL || !appKey) return false
  return true
}

const isPostHogExisted = () => {
  const _env = liuEnv.getEnv()
  const {
    POSTHOG_APIHOST,
    POSTHOG_APIKEY,
  } = _env
  if(POSTHOG_APIHOST && POSTHOG_APIKEY) return true
  return false
}

const isClarityExisted = () => {
  const _env = liuEnv.getEnv()
  const {
    MS_CLARITY_PROJECT_ID,
    MS_CLARITY_SCRIPT,
  } = _env
  if(MS_CLARITY_PROJECT_ID && MS_CLARITY_SCRIPT) return true
  return false
}

export {
  getSentry,
  getBugfender,
  getPostHog,
  isSentryExisted,
  isBugfenderExisted,
  isPostHogExisted,
  isClarityExisted,
}