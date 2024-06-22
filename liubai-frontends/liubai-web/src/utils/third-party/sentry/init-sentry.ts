import liuEnv from "~/utils/liu-env";
import { type App } from "vue"

async function getSentryInitConfig() {
  const _env = liuEnv.getEnv()
  const dsn = _env.SENTRY_DSN
  if(!dsn) return

  const isDev = _env.DEV

  // 1. setup tracePropagationTargets
  const apiDomain = _env.API_DOMAIN
  const tracePropagationTargets = ["localhost"]
  if(apiDomain) {
    tracePropagationTargets.push(apiDomain)
  }

  // 2. setup environment
  let environment = _env.SENTRY_ENVIRONMENT
  if(!environment) {
    if(isDev) environment = "dev"
    else environment = "production"
  }

  // 3. setup release
  const release = LIU_ENV.version

  const Sentry = await import("@sentry/vue")

  const cfg = {
    dsn,
    environment,
    release,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    tracingOptions: {
      trackComponents: true,
    },
  }
  return cfg
}


export async function initSentry(
  vueApp: App<Element>,
) {
  const cfg = await getSentryInitConfig()
  if(!cfg) return
  const sentryCfg = {
    app: vueApp,
    ...cfg,
  }
  const Sentry = await import("@sentry/vue")
  Sentry.init(sentryCfg)
}