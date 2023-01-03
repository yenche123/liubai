import { computed, onActivated, onDeactivated, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import liuUtil from "../../../../../../utils/liu-util";
import type { SupportedLocale } from "../../../../../../types/types-locale"; 
import time from "../../../../../../utils/basic/time";
import type { TcaProps } from "./types"
import type { MenuItem } from "../../../../../common/liu-menu/tools/types"
import { ThreadShow } from "../../../../../../types/types-content";
import valTool from "../../../../../../utils/basic/val-tool";
import commonOperate from "../../../../utils/common-operate";
import checker from "../../../../../../utils/other/checker";
import { useWorkspaceStore } from "../../../../../../hooks/stores/useWorkspaceStore";
import type { SnackbarRes } from "../../../../../../types/other/types-snackbar"

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
  const remindStr = ref("")

  let timeout = 0

  // 给定终点的时间戳，开始倒计时
  // 如果已到或过终点时间，则使用 showBasicDate 展示
  const _setCountDown = (endStamp: number) => {

    const now = time.getTime()
    const diff = endStamp - now

    // 如果倒计时只剩下 1s 或者已过时
    if(diff < SEC) {
      clearTimeout(timeout)
      remindStr.value = liuUtil.showBasicDate(endStamp)
      return
    }

    // 开始计算怎么显示
    remindStr.value = liuUtil.getCountDownStr(diff)

    // 最后计算多久之后再改变 remindStr
    let delay = diff < HOUR ? SEC : MIN
    timeout = setTimeout(() => {
      _setCountDown(endStamp)
    }, delay)
  }


  const _setRemindStr = () => {
    if(timeout) clearTimeout(timeout)

    const rStamp = remindStamp.value
    const rVal = remindMe.value

    if(!rVal || !rStamp) {
      remindStr.value = ""
      return
    }
    const now = time.getTime()
    const diff = rStamp - now

    const { type, early_minute } = rVal

    // xx分之前或准点
    if(type === "early" && typeof early_minute === "number") {
      // 如果已过时，或者时间差只剩 1 分钟之内，那么正常显示时间
      if(diff < MIN) {
        remindStr.value = liuUtil.getRemindMeStrAfterPost(rStamp, rVal)
        return
      }

      // 如果提醒我的时间不是准点，也不采用倒计时
      if(early_minute !== 0) {
        remindStr.value = liuUtil.getRemindMeStrAfterPost(rStamp, rVal)
        return
      }

      // 采用倒计时显示 提醒我
      _setCountDown(rStamp)
      return
    }

    // 剩余 24 小时内的
    if(diff > (3 * SEC) && diff < (24 * HOUR)) {
      _setCountDown(rStamp)
      return
    }

    remindStr.value = liuUtil.getRemindMeStrAfterPost(rStamp, rVal)
  }

  watch(remindStamp, (newV) => {
    _setRemindStr()
  })

  _setRemindStr()

  onActivated(() => {
    _setRemindStr()
  })

  onDeactivated(() => {
    if(timeout) {
      clearTimeout(timeout)
      timeout = 0
    }
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