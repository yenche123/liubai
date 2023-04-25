import { toRef, watchEffect } from "vue";
import type { CmaProps, MaData } from "./types-cma";
import type { CeState } from "../../tools/atom-ce";
import liuUtil from "~/utils/liu-util";
import { useI18n } from "vue-i18n"
import type { ComposerTranslation } from "vue-i18n"
import type { FileShow, LiuFileStore } from "~/types";

export function receiveCmaProps(props: CmaProps, data: MaData) {
  const { t, locale } = useI18n()
  const stateRef = toRef(props, "state")

  // 在外部 的一个同步周期内连续的使用 
  //   state.x1 = "xxxxx"
  //   state.x2 = "yyyyy"
  // 比如: useCeState.ts 文件里，toWhenChange 和 toRemindMeChange 同时被触发了
  // 同时更改了 state.whenStamp 和 state.remindMe
  // 这里的 watchEffect 只会被触发一次
  watchEffect(() => {
    const state = stateRef.value
    const lang = locale.value
    if(state && lang) stateChanged(data, state, t)
  })
}

function stateChanged(
  data: MaData, 
  state: CeState,
  t: ComposerTranslation,
) {
  
  // console.log("stateChanged，看此值有没有疯狂触发........")
  // console.log(JSON.stringify(toRaw(state)))
  // console.log(" ")

  const { 
    whenStamp, 
    storageState, 
    title: newTitle = "",
    remindMe,
    files: newFiles,
  } = state

  // 开始一个个字段判断

  // 什么时候
  const newWhen = whenStamp ? liuUtil.showBasicDate(whenStamp) : ""
  if(newWhen !== data.whenStr) {
    data.whenStr = newWhen
    if(whenStamp) data.whenDate = new Date(whenStamp)
  }

  // remindType 依赖于 when
  const newRemindType = newWhen ? "early" : "later"
  if(data.remindType !== newRemindType) data.remindType = newRemindType

  // 提醒我
  const newRemindMeStr = liuUtil.getRemindMeStr(t, remindMe)
  if(newRemindMeStr !== data.remindMeStr) {
    data.remindMeStr = newRemindMeStr
  }

  // 标题
  if(newTitle !== data.title) {
    data.title = newTitle
  }

  // 文件
  checkAttachment(data, newFiles)

  // 云同步
  const newSyncCloud = storageState === "CLOUD" || storageState === "WAIT_UPLOAD"
  if(newSyncCloud !== data.syncCloud) data.syncCloud = newSyncCloud
  const newDisabled = storageState === "ONLY_LOCAL"
  if(newDisabled !== data.scDisabled) data.scDisabled = newDisabled
  
}

function checkAttachment(
  data: MaData,
  newFiles?: LiuFileStore[],
) {
  const firstFile = newFiles?.[0]
  if(!firstFile) {
    if(data.fileShow) delete data.fileShow
    return
  }

  const currentId = data.fileShow?.id
  if(currentId === firstFile.id) return

  const newFileShow: FileShow = {
    id: firstFile.id,
    name: firstFile.name,
    suffix: firstFile.suffix,
    size: firstFile.size,
    cloud_url: firstFile.cloud_url,
  }

  data.fileShow = newFileShow
}
