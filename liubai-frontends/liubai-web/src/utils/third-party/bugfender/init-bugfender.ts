import liuEnv from "~/utils/liu-env";

export async function initBugFender() {
  const _env = liuEnv.getEnv()
  const {
    BUGFENDER_APIURL: apiURL,
    BUGFENDER_BASEURL: baseURL,
    BUGFENDER_APPKEY: appKey,
  } = _env
  if(!apiURL || !baseURL || !appKey) return

  const { Bugfender } = await import("@bugfender/sdk")

  const version = LIU_ENV.version
  Bugfender.init({
    appKey,
    apiURL, 
    baseURL, 
    version, 
    printToConsole: false,
    overrideConsoleMethods: false,
    logBrowserEvents: false,
    logUIEvents: false,
  })
}