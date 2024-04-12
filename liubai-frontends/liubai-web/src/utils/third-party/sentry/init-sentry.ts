import liuEnv from "~/utils/liu-env";
import * as Sentry from "@sentry/vue";

export function getSentryInitConfig() {
  const _env = liuEnv.getEnv()
  const dsn = _env.SENTRY_DSN
  if(!dsn) return

  // 1. setup tracePropagationTargets
  const apiDomain = _env.API_DOMAIN
  const tracePropagationTargets = ["localhost"]
  if(apiDomain) {
    tracePropagationTargets.push(apiDomain)
  }

  // 2. setup environment
  let environment = _env.SENTRY_ENVIRONMENT
  if(!environment) {
    if(_env.DEV) environment = "dev"
    else environment = "production"
  }

  const cfg = {
    dsn,
    environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  }
  return cfg
}