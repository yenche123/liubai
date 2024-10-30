import valTool from "~/utils/basic/val-tool"
import liuEnv from "~/utils/liu-env"
import { waitWindowLoaded } from "~/utils/wait/wait-window-loaded"

export async function initAnalytics() {

  // console.time("wait window loaded")
  await waitWindowLoaded()
  // console.timeEnd("wait window loaded")

  const _env = liuEnv.getEnv()
  const {
    BUGFENDER_APIURL,
    BUGFENDER_BASEURL,
    BUGFENDER_APPKEY,
    UMAMI_ID, 
    UMAMI_SCRIPT,
    MS_CLARITY_SCRIPT,
    MS_CLARITY_PROJECT_ID,
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
    GOATCOUNTER_DATA,
    GOATCOUNTER_SRC,
    TINYLYTICS_SRC,
  } = _env

  if(BUGFENDER_APIURL && BUGFENDER_BASEURL && BUGFENDER_APPKEY) {
    initBugFender(BUGFENDER_APIURL, BUGFENDER_BASEURL, BUGFENDER_APPKEY)
  }

  if(UMAMI_ID && UMAMI_SCRIPT) {
    initUmami(UMAMI_SCRIPT, UMAMI_ID)
  }

  if(MS_CLARITY_PROJECT_ID && MS_CLARITY_SCRIPT) {
    initClarity(MS_CLARITY_SCRIPT, MS_CLARITY_PROJECT_ID)
  }

  if(OPENPANEL_API_URL && OPENPANEL_CLIENT_ID) {
    initOpenPanel(OPENPANEL_API_URL, OPENPANEL_CLIENT_ID, OPENPANEL_CLIENT_SECRET)
  }

  if(POSTHOG_APIHOST && POSTHOG_APIKEY) {
    initPostHog(POSTHOG_APIHOST, POSTHOG_APIKEY)
  }

  if(CF_WEB_ANALYTICS_SRC && CF_WEB_ANALYTICS_TOKEN) {
    initCloudflareWA(
      CF_WEB_ANALYTICS_SRC,
      CF_WEB_ANALYTICS_TOKEN,
      CF_WEB_ANALYTICS_SENDTO,
    )
  }

  if(PLAUSIBLE_SRC && PLAUSIBLE_DOMAIN) {
    initPlausible(PLAUSIBLE_SRC, PLAUSIBLE_DOMAIN)
  }

  if(GOATCOUNTER_DATA && GOATCOUNTER_SRC) {
    initGoatCounter(GOATCOUNTER_DATA, GOATCOUNTER_SRC)
  }

  if(TINYLYTICS_SRC) {
    initTinylytics(TINYLYTICS_SRC)
  }

}

function initTinylytics(src: string) {
  const scriptEl = document.createElement('script')
  scriptEl.src = src
  scriptEl.defer = true
  insertScript(scriptEl)
}

function initGoatCounter(
  data: string,
  src: string,
) {
  const scriptEl = document.createElement('script')
  scriptEl.src = src
  scriptEl.async = true
  scriptEl.setAttribute("data-goatcounter", data)
  insertScript(scriptEl)
}

async function initBugFender(
  apiURL: string,
  baseURL: string,
  appKey: string,
) {
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


function initPlausible(
  src: string,
  domain: string,
) {
  const scriptEl = document.createElement('script')
  scriptEl.src = src
  scriptEl.defer = true
  scriptEl.setAttribute("data-domain", domain)
  insertScript(scriptEl)
}

function initCloudflareWA(
  script: string, 
  token: string,
  sendTo?: string,
) {
  const scriptEl = document.createElement('script')
  const json: Record<string, any> = { token }
  if(sendTo) {
    json.send = {}
    json.send.to = sendTo
  }
  const cfBeacon = valTool.objToStr(json)
  scriptEl.src = script
  scriptEl.setAttribute("data-cf-beacon", cfBeacon)
  scriptEl.defer = true
  insertScript(scriptEl)
}


async function initPostHog(api_host: string, api_key: string) {
  const { posthog } = await import("posthog-js")
  posthog.init(api_key, { api_host, enable_heatmaps: true })
}

async function initOpenPanel(
  apiUrl: string, 
  client_id: string,
  client_secret?: string,
) {
  const { OpenPanel } = await import("@openpanel/web")
  new OpenPanel({
    apiUrl,
    clientId: client_id,
    clientSecret: client_secret,
    trackScreenViews: true,
    trackAttributes: true,
    trackOutgoingLinks: true,
  })
}


function initUmami(script: string, umami_id: string) {
  const scriptEl = document.createElement('script')
  scriptEl.type = "text/javascript"
  scriptEl.src = script
  scriptEl.setAttribute("data-website-id", umami_id)
  scriptEl.defer = true
  scriptEl.async = true
  insertScript(scriptEl)
}


function initClarity(script: string, project_id: string) {
  const scriptEl = document.createElement('script')
  scriptEl.type = "text/javascript"
  scriptEl.defer = true
  scriptEl.async = true

  let text = `(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="uuuuu"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "xxxxx");`
  text = text.replace("xxxxx", project_id);
  text = text.replace("uuuuu", script);
  scriptEl.innerHTML = text
  
  insertScript(scriptEl)
}

function insertScript(
  scriptEl: HTMLScriptElement,
) {
  const headEl = document.querySelector("head")
  if(!headEl) return
  headEl.appendChild(scriptEl)
}