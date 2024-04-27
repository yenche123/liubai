
import time from "../basic/time"
import liuEnv from "../liu-env";
import localCache from "../system/local-cache";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { db } from "../db";
import type { Sentry_Breadcrumb } from "./types"

const showNowStamp = () => {
  const s = time.getTime()
  console.log(`%c当前时间戳: %c${s}`, "color: #666;", "color: #8888cc;")
}

const _getSentry = async () => {
  const Sentry = await import("@sentry/vue")
  return Sentry
}

const _isSentryExisted = () => {
  const _env = liuEnv.getEnv()
  const dsn = _env.SENTRY_DSN
  return Boolean(dsn)
}

const sendException = async (err: any) => {
  const hasSentry = _isSentryExisted()
  if(!hasSentry) return

  const Sentry = await _getSentry()
  Sentry.captureException(err)
}

const sendMessage = async (message: string) => {
  const hasSentry = _isSentryExisted()
  if(!hasSentry) return

  const Sentry = await _getSentry()
  Sentry.captureMessage(message)
}

// 打点，记录面包屑
// Only when an error occurs and it will be captured by Sentry,
// the breadcrumb will be recorded
const addBreadcrumb = async (breadcrumb: Sentry_Breadcrumb) => {
  // 1. check if sentry has been existed
  const hasSentry = _isSentryExisted()
  if(!hasSentry) return

  // 2. add breadcrumb
  const bc: Sentry_Breadcrumb = {
    type: "default",
    level: "info",
    ...breadcrumb,
  }
  const Sentry = await _getSentry()
  Sentry.addBreadcrumb(bc)
}

// when workspace state is changed, please trigger the function
const setUserTagsCtx = async () => {
  const hasSentry = _isSentryExisted()
  if(!hasSentry) return

  const { 
    token,
    local_id: userId,
    theme,
    language,
  } = localCache.getPreference()

  const Sentry = await _getSentry()

  // 1. set tags
  Sentry.setTag("liu-theme", theme)
  Sentry.setTag("liu-language", language)
  Sentry.setTag("liu-has-token", Boolean(token))


  // 2. set workspace as context
  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId
  const memberId = wStore.memberId
  const spaceType = wStore.spaceType
  const m = wStore.myMember
  const nickname = m?.name

  Sentry.setContext("workspace", {
    spaceId,
    memberId,
    spaceType,
  })

  // 3. if no user
  if(!userId) {
    Sentry.setUser(null)
    return
  }

  // 4. get user's email from db
  const res = await db.users.get(userId)
  const email = res?.email

  Sentry.setUser({
    id: userId,
    username: nickname,
    email,
  })
}



export default {
  showNowStamp,
  sendException,
  sendMessage,
  addBreadcrumb,
  setUserTagsCtx,
}