import liuEnv from "~/utils/liu-env"

export function initAnalytics() {
  
  const _env = liuEnv.getEnv()
  const { 
    UMAMI_ID, 
    UMAMI_SCRIPT,
    MS_CLARITY_SCRIPT,
    MS_CLARITY_PROJECT_ID,
    OPENPANEL_API,
    OPENPANEL_CLIENT_ID,
    OPENPANEL_CLIENT_SECRET,
    POSTHOG_APIHOST,
    POSTHOG_APIKEY,
  } = _env

  if(UMAMI_ID && UMAMI_SCRIPT) {
    initUmami(UMAMI_SCRIPT, UMAMI_ID)
  }

  if(MS_CLARITY_PROJECT_ID && MS_CLARITY_SCRIPT) {
    initClarity(MS_CLARITY_SCRIPT, MS_CLARITY_PROJECT_ID)
  }

  if(OPENPANEL_API && OPENPANEL_CLIENT_ID) {
    initOpenPanel(OPENPANEL_API, OPENPANEL_CLIENT_ID, OPENPANEL_CLIENT_SECRET)
  }

  if(POSTHOG_APIHOST && POSTHOG_APIKEY) {
    initPostHog(POSTHOG_APIHOST, POSTHOG_APIKEY)
  }

}

async function initPostHog(api_host: string, api_key: string) {
  const { posthog } = await import("posthog-js")
  posthog.init(api_key, { api_host })
}

async function initOpenPanel(
  api: string, 
  client_id: string,
  client_secret?: string,
) {
  const { Openpanel } = await import("@openpanel/web")

  new Openpanel({
    url: api,
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
  const headEl = document.querySelector("head")
  if(!headEl) return
  headEl.appendChild(scriptEl)
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
  
  const headEl = document.querySelector("head")
  if(!headEl) return
  headEl.appendChild(scriptEl)
}