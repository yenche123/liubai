import { computed, onActivated, onDeactivated, ref, toRef, watch } from "vue";
import type { ComputedRef, Ref } from "vue";
import { useI18n } from "vue-i18n";
import liuUtil from "~/utils/liu-util";
import type { SupportedLocale } from "~/types/types-locale"; 
import time from "~/utils/basic/time";
import type { TcaProps } from "./types"
import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import type { ThreadShow } from "~/types/types-content";
import valTool from "~/utils/basic/val-tool";
import threadOperate from "~/hooks/thread/thread-operate";
import checker from "~/utils/other/checker";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { SnackbarRes } from "~/types/other/types-snackbar"
import type { LiuRemindMe } from "~/types/types-atom"
import type { ContentConfig } from "~/types/other/types-custom";
import type { LiuTimeout } from "~/utils/basic/type-tool";

const { 
  SECONED: SEC,
  MINUTE: MIN,
  HOUR,
} = time

// 专门显示 "什么时候" / "提醒我"
export function useWhenAndRemind(props: TcaProps) {

  const { locale } = useI18n()
  const threadData = toRef(props, "thread")

  const whenStamp = computed(() => threadData.value.whenStamp)
  const remindStamp = computed(() => threadData.value.remindStamp)
  const remindMe = computed(() => threadData.value.remindMe)
  const contentCfg = computed(() => threadData.value.config)
  const wStore = useWorkspaceStore()

  const canEdit = computed(() => {
    const t = threadData.value
    if(t.oState !== 'OK') return false
    if(!wStore.memberId) return false
    if(wStore.spaceId !== t.spaceId) return false
    if(t.spaceType === "ME" && !t.isMine) return false
    return true
  })

  const whenStr = computed(() => {
    let nowLocale = locale.value
    let whenStampVal = whenStamp.value
    if(!whenStampVal) return ""
    return liuUtil.showBasicDate(whenStampVal, nowLocale as SupportedLocale)
  })
  const remindStr = ref("")
  const countdownStr = ref("")
  handleCountdown(whenStamp, countdownStr, contentCfg)
  handleRemind(remindStamp, remindMe, remindStr)

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


function handleCountdown(
  whenStamp: ComputedRef<number | undefined>,
  countdownStr: Ref<string>,
  contentCfg: ComputedRef<ContentConfig | undefined>
) {
  let timeout: LiuTimeout

  const _clearTimeout = () => {
    if(timeout) {
      clearTimeout(timeout)
      timeout = undefined
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

    // 最后计算多久之后再改变 countdownStr
    let delay = diff < HOUR ? SEC : MIN
    // 校准 timer
    if(delay === SEC) {
      let tmp = diff % SEC
      if(tmp < 500) delay += tmp
      else delay = tmp
    }

    timeout = setTimeout(() => {
      timeout = undefined
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

    const cCfg = contentCfg.value
    if(cCfg && cCfg.showCountdown === false) {
      countdownStr.value = ""
      return
    }

    _setCountDown(wStamp)
  }

  watch([whenStamp, contentCfg], (newV) => {
    _judgeCountdown()
  }, { immediate: true })

  onActivated(() => {
    _judgeCountdown()
  })

  onDeactivated(() => {
    _clearTimeout()
  })
}


function handleRemind(
  remindStamp: ComputedRef<number | undefined>,
  remindMe: ComputedRef<LiuRemindMe | undefined>,
  remindStr: Ref<string>,
) {

  let timeout: LiuTimeout

  const _clearTimeout = () => {
    if(timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
  }

  const _setRemindStr = (
    rStamp: number,
    rMe: LiuRemindMe,
  ) => {
    const now = time.getTime()
    const diff = rStamp - now
    const { type } = rMe
    if(diff < (SEC / 2)) {
      _clearTimeout()
      remindStr.value = liuUtil.getRemindMeStrAfterPost(rStamp, rMe)
      return
    }
    if(type === "early" || type === "specific_time") {
      _clearTimeout()
      remindStr.value = liuUtil.getRemindMeStrAfterPost(rStamp, rMe)
      return
    }

    remindStr.value = liuUtil.getCountDownStr(diff)

    // 最后计算多久之后再改变 remindStr
    let delay = diff < HOUR ? SEC : MIN
    // 校准 timer
    if(delay === SEC) {
      let tmp = diff % SEC
      if(tmp < 500) delay += tmp
      else delay = tmp
    }
    timeout = setTimeout(() => {
      timeout = undefined
      _setRemindStr(rStamp, rMe)
    }, delay)
  }

  const _judgeRemind = () => {
    _clearTimeout()
    const rStamp = remindStamp.value
    const rMe = remindMe.value

    if(!rStamp || !rMe) {
      remindStr.value = ""
      return
    }
    _setRemindStr(rStamp, rMe)
  }

  watch(remindStamp, (newV) => {
    _judgeRemind()
  }, { immediate: true })

  onActivated(() => {
    _judgeRemind()
  })

  onDeactivated(() => {
    _clearTimeout()
  })
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
    res = await threadOperate.setWhen(oldThread, memberId, userId)
  }
  else if(index === 1) {
    // 清除
    res = await threadOperate.clearWhen(oldThread, memberId, userId)
  }

  if(!res?.tipPromise) return

  const res2 = await res.tipPromise
  if(res2.result !== "tap") return
  threadOperate.undoWhenRemind(oldThread, memberId, userId)

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
    res = await threadOperate.setRemind(oldThread, memberId, userId)
  }
  else if(index === 1) {
    // 清除
    res = await threadOperate.clearRemind(oldThread, memberId, userId)
  }

  if(!res?.tipPromise) return

  const res2 = await res.tipPromise
  if(res2.result !== "tap") return
  threadOperate.undoWhenRemind(oldThread, memberId, userId)
}