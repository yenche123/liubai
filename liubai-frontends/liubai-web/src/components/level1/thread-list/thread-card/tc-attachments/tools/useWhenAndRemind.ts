import { computed, onActivated, onDeactivated, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import liuUtil from "~/utils/liu-util";
import type { SupportedLocale } from "~/types/types-locale"; 
import time from "~/utils/basic/time";
import type { TcaProps } from "./types"
import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import { ThreadShow } from "~/types/types-content";
import valTool from "~/utils/basic/val-tool";
import commonOperate from "../../../../utils/common-operate";
import checker from "~/utils/other/checker";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { SnackbarRes } from "~/types/other/types-snackbar"

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN

// 专门显示 "什么时候" / "提醒我"
export function useWhenAndRemind(props: TcaProps) {

  const { t, locale } = useI18n()
  const threadData = toRef(props, "thread")

  const whenStamp = computed(() => threadData.value.whenStamp)
  const remindStamp = computed(() => threadData.value.remindStamp)
  const remindMe = computed(() => threadData.value.remindMe)
  const wStore = useWorkspaceStore()

  const canEdit = computed(() => {
    const t = threadData.value
    if(t.oState !== 'OK') return false
    if(!wStore.memberId) return false
    if(wStore.memberId === t.member_id) return true
    if(wStore.workspace !== t.workspace) return false
    return true
  })

  const whenStr = computed(() => {
    let nowLocale = locale.value
    let whenStampVal = whenStamp.value
    if(!whenStampVal) return ""
    return liuUtil.showBasicDate(whenStampVal, nowLocale as SupportedLocale)
  })
  const remindStr = computed(() => {
    const rStamp = remindStamp.value
    const rVal = remindMe.value
    if(!rStamp || !rVal) return ""
    return liuUtil.getRemindMeStrAfterPost(rStamp, rVal)
  })
  const countdownStr = ref("")

  let timeout = 0

  const _clearTimeout = () => {
    if(timeout) {
      clearTimeout(timeout)
      timeout = 0
    }
  }

  // 给定终点的时间戳，开始倒计时
  const _setCountDown = (endStamp: number) => {
    const now = time.getTime()
    const diff = endStamp - now

    // 如果倒计时只剩下 半秒 或者已过时
    if(diff < (SEC / 2)) {
      _clearTimeout()
      countdownStr.value = ""
      return
    }

    // 开始计算怎么显示
    countdownStr.value = liuUtil.getCountDownStr(diff)

    // 最后计算多久之后再改变 remindStr
    let delay = diff < HOUR ? SEC : MIN
    // 校准 timer
    if(delay === SEC) {
      let tmp = diff % SEC
      if(tmp < 500) delay += tmp
      else delay = tmp
    }

    timeout = setTimeout(() => {
      timeout = 0
      _setCountDown(endStamp)
    }, delay)
  }

  const _judgeCountdown = () => {
    _clearTimeout()
    const wStamp = whenStamp.value
    if(!wStamp) {
      countdownStr.value = ""
      return
    }
    _setCountDown(wStamp)
  }

  watch(whenStamp, (newV) => {
    _judgeCountdown()
  })

  _judgeCountdown()

  onActivated(() => {
    _judgeCountdown()
  })

  onDeactivated(() => {
    _clearTimeout()
  })

  const onTapWhenItem = (item: MenuItem, index: number) => {
    const { userId, memberId } = getUserAndMemberId(props.thread)
    if(!userId || !memberId) return
    toTapWhenItem(index, props.thread, userId, memberId)
  }

  const onTapRemindItem = (item: MenuItem, index: number) => {
    const { userId, memberId } = getUserAndMemberId(props.thread)
    if(!userId || !memberId) return
    toTapRemindItem(index, props.thread, userId, memberId)
  }

  return { 
    whenStr, 
    remindStr,
    countdownStr,
    canEdit,
    onTapWhenItem,
    onTapRemindItem,
  }
}

function getUserAndMemberId(
  thread: ThreadShow
) {
  const { userId } = checker.getUserId()
  if(!userId) return {}
  const { memberId } = checker.getMemberId(thread)

  return { userId, memberId }
}


async function toTapWhenItem(
  index: number,
  thread: ThreadShow,
  userId: string,
  memberId: string
) {
  const oldThread = valTool.copyObject(thread)

  let res: { tipPromise: Promise<SnackbarRes> } | undefined
  if(index === 0) {
    // 重选
    res = await commonOperate.setWhen(oldThread, memberId, userId)
  }
  else if(index === 1) {
    // 清除
    res = await commonOperate.clearWhen(oldThread, memberId, userId)
  }

  if(!res?.tipPromise) return

  const res2 = await res.tipPromise
  if(res2.result !== "tap") return
  commonOperate.undoWhenRemind(oldThread, memberId, userId)

}

async function toTapRemindItem(
  index: number,
  thread: ThreadShow,
  userId: string,
  memberId: string,
) {
  const oldThread = valTool.copyObject(thread)

  let res: { tipPromise: Promise<SnackbarRes> } | undefined
  if(index === 0) {
    // 重选
    res = await commonOperate.setRemind(oldThread, memberId, userId)
  }
  else if(index === 1) {
    // 清除
    res = await commonOperate.clearRemind(oldThread, memberId, userId)
  }

  if(!res?.tipPromise) return

  const res2 = await res.tipPromise
  if(res2.result !== "tap") return
  commonOperate.undoWhenRemind(oldThread, memberId, userId)
}