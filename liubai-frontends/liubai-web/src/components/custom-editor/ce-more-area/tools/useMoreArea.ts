import { computed, reactive } from "vue";
import cui from "../../../custom-ui";
import type { LiuRemindMe, LiuRemindEarly, LiuRemindLater } from "../../../../types/types-atom"
import liuUtil from "../../../../utils/liu-util";
import type { MenuItem } from "../../../common/liu-menu/liu-menu.vue"
import { useI18n } from "vue-i18n";
import en from "../../../../locales/messages/en.json"
import { REMIND_LATER, REMIND_EARLY } from "../../../../config/atom"
import type { SwitchChangeEmitOpt } from "../../../common/liu-switch/liu-switch.vue"
import type { MaData, MoreAreaEmits, MaContext } from "./types-cma"

export function useMoreArea(emits: MoreAreaEmits) {
  const { t } = useI18n()

  // 仅存储 "UI" 信息即可，逻辑原子化信息会回传至 custom-editor
  const data = reactive<MaData>({
    whenStr: "",       // 什么时候
    remindMeStr: "",   // 提醒我
    title: "",      // 标题
    site: "",       // 地点名称，如果没有就显示经纬度
    attachment: "",  // 附件名称
    syncCloud: true,
    scDisabled: false,
    remindType: "later",
  })

  const remindMenu = computed<MenuItem[]>(() => {
    const list: MenuItem[] = []
    const hasWhen = data.whenStr.length > 0
    
    // 有几个数组，请查阅 en.json 的 remind_later / remind_early
    
    const text_key = hasWhen ? "remind_early" : "remind_later"
    const length = en.date_related[text_key].length

    for(let i=0; i<length; i++) {
      list.push({ text: t(`date_related.${text_key}[${i}]`) })
    }
    return list
  })

  const ctx: MaContext = { emits, data }

  const onTapWhen = async () => {
    const res = await cui.showDatePicker({ minDate: new Date(), date: data.whenDate })
    if(!res.confirm || !res.date) return
    setNewWhen(ctx, res.date)
  }

  const onTapClearWhen = (e: MouseEvent) => {
    if(data.whenStr) {
      setNewWhen(ctx)
      e.stopPropagation()
    }
  }

  const onTapRemindItem = (item: MenuItem, index: number) => {
    setNewRemind(ctx, item, index)
  }

  const onTapClearRemind = (e: MouseEvent) => {
    if(data.remindMeStr) {
      setNewRemind(ctx)
      e.stopPropagation()
    }
  }

  const onTapSyncToCloud = () => {
    const newV = !data.syncCloud
    data.syncCloud = newV
    emits("synccloudchange", newV)
  }

  const onSyncCloudChange = (val: SwitchChangeEmitOpt) => {
    if(val.checked !== data.syncCloud) {
      data.syncCloud = val.checked
      emits("synccloudchange", val.checked)
    }
  }

  const onTapAddTitle = () => {
    toAddTitle(ctx)
  }

  const onTapClearTitle = (e: MouseEvent) => {
    toClearTitle(ctx)
    e.stopPropagation()
  }

  return { 
    data,
    remindMenu,
    onTapWhen,
    onTapClearWhen,
    onTapRemindItem,
    onTapClearRemind,
    onTapSyncToCloud,
    onSyncCloudChange,
    onTapAddTitle,
    onTapClearTitle,
  }
}

async function toAddTitle(ctx: MaContext) {
  const res = await cui.showTextEditor({
    title_key: "editor.add_title2",
    placeholder_key: "editor.title_ph",
    value: ctx.data.title,
    maxLength: 32,
  })
  if(!res.confirm || !res.value) return
  ctx.data.title = res.value
  ctx.emits("titlechange", res.value)
}

function toClearTitle(ctx: MaContext) {
  ctx.data.title = ""
  ctx.emits("titlechange", "")
}

function setNewRemind(ctx: MaContext, item?: MenuItem, index?: number) {
  if(!item || index === undefined) {
    ctx.data.remindMeStr = ""
    ctx.emits("remindmechange", null)
    return
  }
  const remindType = ctx.data.remindType
  const list = remindType === "early" ? REMIND_EARLY : REMIND_LATER
  const v = list[index]

  if(v === undefined) {
    console.warn("设置提醒我时，没有找到合适的选项！")
    return
  }

  if(remindType === "later" && v === "other") {
    toSelectSpecificRemind(ctx)
    return
  }

  ctx.data.remindMeStr = item.text
  const r: LiuRemindMe = {
    type: remindType,
    early_minute: remindType === "early" ? (v as LiuRemindEarly) : undefined,
    later: remindType === "later" ? (v as LiuRemindLater) : undefined
  }
  ctx.emits("remindmechange", r)
}

// 为 "提醒我"，选择特定的时间
async function toSelectSpecificRemind(ctx: MaContext) {
  const res = await cui.showDatePicker({ minDate: new Date() })
  if(!res.confirm || !res.date) return
  ctx.data.remindMeStr = liuUtil.showBasicDate(res.date)
  const r: LiuRemindMe = {
    type: "specific_time",
    specific_stamp: res.date.getTime()
  }
  ctx.emits("remindmechange", r)
}

function setNewWhen(ctx: MaContext, date?: Date) {
  ctx.emits("whenchange", date ? date : null)

  if(date && ctx.data.remindType === "later") {
    if(ctx.data.remindMeStr) {
      ctx.emits("remindmechange", null)
    }
  }
  else if(!date && ctx.data.remindType === "early") {
    if(ctx.data.remindMeStr) {
      ctx.emits("remindmechange", null)
    }
  }
}