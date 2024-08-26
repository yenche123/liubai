import { type LocalPreference } from "~/utils/system/tools/types";
import liuEnv from "~/utils/liu-env";
import type OpenReplayTracker from "@openreplay/tracker";
import { type SomeProperties } from "./types";

let tracker: OpenReplayTracker | undefined

interface OpenReplayOptions {
  projectKey: string
  ingestPoint?: string
  obscureTextEmails?: boolean
  obscureTextNumbers?: boolean
  obscureInputEmails?: boolean
  obscureInputDates?: boolean
  __DISABLE_SECURE_MODE?: boolean
}

export async function initOpenReplay(
  localP: LocalPreference,
  opt: SomeProperties,
) {
  let id = opt.email ?? localP.open_id
  if(!id) return

  const _env = liuEnv.getEnv()
  const projectKey = _env.OPENREPLAY_PROJECT_KEY
  const ingestPoint = _env.OPENREPLAY_INGEST_POINT
  if(!projectKey) return

  const w: OpenReplayOptions = { 
    obscureTextEmails: true,
    obscureTextNumbers: true,
    obscureInputEmails: true,
    projectKey, 
    // __DISABLE_SECURE_MODE: true,
  }
  if(ingestPoint) {
    w.ingestPoint = ingestPoint
  }
  const Tracker = await import("@openreplay/tracker")
  tracker = new Tracker.default(w)
  tracker.start({ userID: id })
}

export function getOpenReplayTracker() {
  return tracker
}