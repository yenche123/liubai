import { computed, reactive, ref } from "vue";
import cui from "~/components/custom-ui";
import type { LiuRemindMe, LiuRemindEarly, LiuRemindLater } from "~/types/types-atom"
import liuUtil from "~/utils/liu-util";
import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import { REMIND_LATER, REMIND_EARLY } from "~/config/atom"
import type { SwitchChangeEmitOpt } from "~/components/common/liu-switch/types"
import type { MaData, MoreAreaEmits, MaContext, CmaProps } from "./types-cma"
import liuEnv from "~/utils/liu-env";

export function useMoreArea(
  props: CmaProps,
  emits: MoreAreaEmits,
) {
  const selectFileEl = ref<HTMLInputElement | null>(null)

  // 仅存储 "UI" 信息即可，逻辑原子化信息会回传至 custom-editor
  const data = reactive<MaData>({
    whenStr: "",       // 什么时候
    remindMeStr: "",   // 提醒我
    title: "",      // 标题
    site: "",       // 地点名称，如果没有就显示经纬度
    syncCloud: true,
    scDisabled: false,
    remindType: "later",
  })

  const remindMenu = computed<MenuItem[]>(() => {
    const hasWhen = data.whenStr.length > 0
    return liuUtil.getRemindMenu(hasWhen)
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
    }
  }

  const onTapRemindItem = (item: MenuItem, index: number) => {
    setNewRemind(ctx, item, index)
  }

  const onTapClearRemind = (e: MouseEvent) => {
    if(data.remindMeStr) {
      setNewRemind(ctx)
    }
  }

  const onTapSyncToCloud = () => {
    const newV = !data.syncCloud

    const canISync = liuEnv.canISync()
    
    if(!canISync) {
      cui.showModal({
        title_key: "tip.tip",
        content_key: "editor.cannot_sync",
        showCancel: false,
      })
      return
    }

    if(data.scDisabled) return
    emits("synccloudchange", newV)
  }

  const onSyncCloudChange = (val: SwitchChangeEmitOpt) => {
    if(val.checked !== data.syncCloud) {
      emits("synccloudchange", val.checked)
    }
  }

  const onTapAddTitle = () => {
    toAddTitle(ctx, props)
  }

  const onTapClearTitle = (e: MouseEvent) => {
    toClearTitle(ctx)
  }

  const onTapAddSite = (e: MouseEvent) => {
    cui.showModal({
      title_key: "tip.coming_soon",
      content_key: "tip.stay_tuned",
      showCancel: false,
    })
  }

  const onFileChange = () => {
    const el = selectFileEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    const files = liuUtil.getArrayFromFileList(el.files)
    emits("filechange", files)
    el.blur()
  }

  const onTapClearAttachment = (e: MouseEvent) => {
    toClearAttachment(ctx)
  }

  return { 
    selectFileEl,
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
    onFileChange,
    onTapClearAttachment,
    onTapAddSite,
  }
}

async function toAddTitle(
  ctx: MaContext,
  props: CmaProps,
) {
  const res = await cui.showTextEditor({
    title_key: "editor.add_title2",
    placeholder_key: "editor.title_ph",
    value: ctx.data.title,
    maxLength: 66,
  })
  if(!res.confirm || !res.value) return
  ctx.emits("titlechange", res.value)
  
  // 去聚焦
  const editor = props.editor
  if(!editor) return
  editor.commands.focus()
}

function toClearTitle(ctx: MaContext) {
  ctx.emits("titlechange", "")
}

function toClearAttachment(ctx: MaContext) {
  ctx.emits("filechange", null)
}

function setNewRemind(ctx: MaContext, item?: MenuItem, index?: number) {
  if(!item || index === undefined) {
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