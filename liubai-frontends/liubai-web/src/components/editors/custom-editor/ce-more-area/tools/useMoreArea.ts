import { computed, reactive, ref, watch } from "vue";
import cui from "~/components/custom-ui";
import type { LiuRemindMe, LiuRemindEarly, LiuRemindLater } from "~/types/types-atom"
import liuUtil from "~/utils/liu-util";
import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import { REMIND_LATER, REMIND_EARLY } from "~/config/atom"
import type { SwitchChangeEmitOpt } from "~/components/common/liu-switch/types"
import type { MaData, MoreAreaEmits, MaContext, CmaProps } from "./types-cma"
import liuEnv from "~/utils/liu-env";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";
import commonPack from "~/utils/controllers/tools/common-pack";

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
    aiReadable: "Y",
    aiReadDisabled: false,
    remindType: "later",
  })

  const remindMenu = computed<MenuItem[]>(() => {
    const hasWhen = data.whenStr.length > 0
    return liuUtil.getRemindMenu(hasWhen)
  })

  const ctx: MaContext = { props, emits, data }

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

  handleState(props, data)

  const privacyMenu = computed<MenuItem[]>(() => {
    const s1 = data.syncCloud
    const s2 = data.scDisabled
    const s3 = data.aiReadable === "Y"
    const s4 = data.aiReadDisabled
    return [
      {
        text_key: "editor.sync_cloud",
        checked: s1,
        disabled: s2,
      },
      {
        text_key: "editor.ai_readable",
        checked: s3,
        disabled: s4,
      }
    ]
  })

  const onTapPrivacyItem = (item: MenuItem, index: number) => {
    const _item = privacyMenu.value[index]
    if(!_item) return
    if(index === 0) {
      emits("synccloudchange", !_item.checked)
    }
    else if(index === 1) {
      emits("aireadablechange", !_item.checked)
    }
  }

  return { 
    selectFileEl,
    data,
    remindMenu,
    privacyMenu,
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
    onTapAddState: () => setNewState(ctx),
    onTapClearState: () => emits("statechange", null),
    onTapPrivacyItem,
  }
}


async function handleState(
  props: CmaProps,
  data: MaData,
) {
  const stateId = computed(() => props.ceData?.stateId)
  const ws = useWorkspaceStore()
  const { spaceId } = storeToRefs(ws)

  watch([stateId, spaceId], ([newV1, newV2]) => {
    if(!newV1 || !newV2) {
      delete data.stateShow
      return
    }

    const theStateShow = commonPack.getStateShow(newV1, ws)
    data.stateShow = theStateShow
  }, { immediate: true })
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

async function setNewState(ctx: MaContext) {
  const stateIdSelected = ctx.props.ceData?.stateId
  const res = await cui.showStateSelector({ stateIdSelected })
  if(res.action === "mask") return
  if(res.action === "remove" && !stateIdSelected) return
  if(res.action === "confirm" && stateIdSelected === res.stateId) return
  ctx.emits("statechange", res.stateId ?? null)
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