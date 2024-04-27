
import liuEnv from "../../liu-env";

const getSentry = async () => {
  const Sentry = await import("@sentry/vue")
  return Sentry
}

const getBugfender = async () => {
  const Bugfender = await import("@bugfender/sdk")
  return Bugfender
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

export {
  getSentry,
  getBugfender,
  isSentryExisted,
  isBugfenderExisted,
}