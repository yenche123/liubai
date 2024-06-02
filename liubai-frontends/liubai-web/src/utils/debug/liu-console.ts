
import time from "../basic/time"
import localCache from "../system/local-cache";
import { db } from "../db";
import {
  getSentry,
  getBugfender,
  isSentryExisted,
  isBugfenderExisted,
  isPostHogExisted,
} from "./tools/some-funcs"
import type { Sentry_Breadcrumb } from "./tools/types"
import {
  setPostHogUserProperties, 
  setSentryUserProperties,
} from "./tools/user-properties";

const showNowStamp = () => {
  const s = time.getTime()
  console.log(`%c当前时间戳: %c${s}`, "color: #666;", "color: #8888cc;")
}

const sendException = async (err: any) => {
  const hasSentry = isSentryExisted()
  if(!hasSentry) return

  const Sentry = await getSentry()
  Sentry.captureException(err)
}

const sendMessage = async (message: string) => {
  const hasSentry = isSentryExisted()
  if(hasSentry) {
    const Sentry = await getSentry()
    Sentry.captureMessage(message)
  }

  const hasBugfender = isBugfenderExisted()
  if(hasBugfender) {
    const { Bugfender } = await getBugfender()
    Bugfender.log(message)
  }
}

// 打点，记录面包屑
// Only when an error occurs and it will be captured by Sentry,
// the breadcrumb will be recorded
const addBreadcrumb = async (breadcrumb: Sentry_Breadcrumb) => {
  // 1. check if sentry has been existed
  const hasSentry = isSentryExisted()
  if(!hasSentry) return

  // 2. add breadcrumb
  const bc: Sentry_Breadcrumb = {
    type: "default",
    level: "info",
    ...breadcrumb,
  }
  const Sentry = await getSentry()
  Sentry.addBreadcrumb(bc)
}

// when workspace state is changed, please trigger the function
const setUserTagsCtx = async () => {
  const localP = localCache.getPreference()

  let email: string | undefined
  if(localP.local_id) {
    const user = await db.users.get(localP.local_id)
    email = user?.email
  }

  const hasSentry = isSentryExisted()
  if(hasSentry) {
    setSentryUserProperties(localP, { email })
  }

  const hasPostHog = isPostHogExisted()
  if(hasPostHog) {
    setPostHogUserProperties(localP, { email })
  }
  
}



export default {
  showNowStamp,
  sendException,
  sendMessage,
  addBreadcrumb,
  setUserTagsCtx,
}