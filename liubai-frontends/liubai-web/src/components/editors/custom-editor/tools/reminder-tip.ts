import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import liuEnv from "~/utils/liu-env"
import type { Res_OC_GetWeChat } from "~/requests/req-types";
import type { CeData } from "./types";
import cui from "~/components/custom-ui";
import localCache from "~/utils/system/local-cache";
import time from "~/utils/basic/time";
import liuUtil from "~/utils/liu-util";

export function checkIfReminderEnabled(
  memberId: string,
  ceData: CeData,
) {
  const sState = ceData.storageState
  if(sState === "LOCAL") {
    checkIfShowCannotRemind()
    return
  }

  const { NOTIFICATION_PRIORITY: nPriority } = liuEnv.getEnv()
  if(!nPriority || nPriority === "disable") return

  const hasBE = liuEnv.hasBackend()
  if(!hasBE) return

  if(nPriority === "wx_gzh") {
    checkOutWxGzh(memberId)
  }
}

async function checkIfShowCannotRemind() {
  const onceData = localCache.getOnceData()
  if(onceData.cannotRemindStamp) return
  await liuUtil.waitAFrame(true)
  const res = await cui.showModal({
    title_key: "tip.tip",
    content_key: "tip.cannot_remind_you",
    showCancel: false,
    confirm_key: "tip.got_it"
  })
  if(res.confirm) {
    const now = time.getTime()
    localCache.setOnceData("cannotRemindStamp", now)
  }
}


let hasCheckedWxGzh = false
async function checkOutWxGzh(
  memberId: string,
) {
  if(hasCheckedWxGzh) return
  hasCheckedWxGzh = true
  
  // 1. fetch
  const url = APIs.OPEN_CONNECT
  const w = {
    operateType: "get-wechat",
    memberId,
  }
  const res1 = await liuReq.request<Res_OC_GetWeChat>(url, w)
  const { code, data } = res1
  if(code !== "0000" || !data) {
    hasCheckedWxGzh = false
    return
  }

  const hasWxGzhOpenId = Boolean(data.wx_gzh_openid)
  const hasSubscribed = Boolean(data.wx_gzh_subscribed)
  if(hasWxGzhOpenId && hasSubscribed) return
  
  // 2. show modal
  const res2 = await cui.showModal({
    iconUrl: "/images/third-party/wechat.png",
    content_key: "notification.open_wx_gzh",
    confirm_key: "notification.to_follow",
    isTitleEqualToEmoji: true,
  })
  if(!res2.confirm) return

  // 3. popup 
  cui.showQRCodePopup({ bindType: "wx_gzh" })
}