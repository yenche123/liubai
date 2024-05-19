import { toRef, watchEffect } from "vue";
import type { CmaProps, MaData } from "./types-cma";
import type { CeData } from "../../tools/types";
import liuUtil from "~/utils/liu-util";
import { useI18n } from "vue-i18n"
import type { ComposerTranslation } from "vue-i18n"
import type { FileShow, LiuFileStore } from "~/types";
import liuEnv from "~/utils/liu-env";

export function receiveCmaProps(props: CmaProps, data: MaData) {
  const { t, locale } = useI18n()
  const stateRef = toRef(props, "ceData")

  // 在外部 的一个同步周期内连续的使用 
  //   ceData.x1 = "xxxxx"
  //   ceData.x2 = "yyyyy"
  // 比如: useCeData.ts 文件里，toWhenChange 和 toRemindMeChange 同时被触发了
  // 同时更改了 ceData.whenStamp 和 ceData.remindMe
  // 这里的 watchEffect 只会被触发一次
  watchEffect(() => {
    const ceData = stateRef.value
    const lang = locale.value
    if(ceData && lang) stateChanged(data, ceData, t)
  })
}

function stateChanged(
  data: MaData, 
  ceData: CeData,
  t: ComposerTranslation,
) {
  
  // console.log("stateChanged，看此值有没有疯狂触发........")
  // console.log(JSON.stringify(toRaw(ceData)))
  // console.log(" ")

  const { 
    whenStamp, 
    storageState, 
    title: newTitle = "",
    remindMe,
    files: newFiles,
  } = ceData

  // 开始一个个字段判断

  // 什么时候
  const newWhen = whenStamp ? liuUtil.showBasicTime(whenStamp) : ""
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
  const canSync = liuEnv.canISync()
  
  const newSyncCloud = storageState === "CLOUD" || storageState === "WAIT_UPLOAD"
  if(newSyncCloud !== data.syncCloud) data.syncCloud = newSyncCloud
  const newDisabled = !canSync || storageState === "ONLY_LOCAL"
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
