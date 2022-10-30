import { computed, reactive } from "vue";
import cui from "../../../custom-ui";
import type { LiuRemindMe } from "../../../../types/types-atom"
import liuUtil from "../../../../utils/liu-util";
import type { MenuItem } from "../../../common/liu-menu/liu-menu.vue"
import { useI18n } from "vue-i18n";
import en from "../../../../locales/messages/en.json"

interface MoreAreaEmits {
  (event: "whenchange", val: Date | null): void
  (event: "remindmechange", val: LiuRemindMe | null): void
}

interface MaData {
  when: string
  remindMe: string
  title: string
  attachment: string

  // 提醒我的类型，分成 early (准时 / 提前10分钟..) 和 later (30分钟后 / 1小时后.....)
  remindType: "early" | "later"
}

interface MaContext {
  emits: MoreAreaEmits
  data: MaData
}

export function useMoreArea(emits: MoreAreaEmits) {
  const { t } = useI18n()

  // 仅存储 "UI" 信息即可，逻辑原子化信息会回传至 custom-editor
  const data = reactive<MaData>({
    when: "",       // 什么时候
    remindMe: "",   // 提醒我
    title: "",      // 标题
    attachment: "",  // 附件名称
    remindType: "early",
  })

  const remindMenu = computed<MenuItem[]>(() => {
    const list: MenuItem[] = []
    const hasWhen = data.when.length > 0
    
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
    console.log("showDatePicker...........")
    const res = await cui.showDatePicker({ minDate: new Date() })
    if(!res.confirm || !res.date) return
    setNewWhen(ctx, res.date)
  }

  const onTapClearWhen = (e: MouseEvent) => {
    if(data.when) {
      setNewWhen(ctx)
      e.stopPropagation()
    }
  }

  return { 
    data,
    remindMenu,
    onTapWhen,
    onTapClearWhen,
  }
}


function setNewWhen(ctx: MaContext, date?: Date) {
  ctx.data.when = !date ? "" : liuUtil.showBasicDate(date)
  ctx.emits("whenchange", date ? date : null)

  if(date && ctx.data.remindType === "early") {
    ctx.data.remindType = "later"
    if(ctx.data.remindMe) {
      ctx.data.remindMe = ""
      ctx.emits("remindmechange", null)
    }
  }
  else if(!date && ctx.data.remindType === "later") {
    ctx.data.remindType = "early"
    if(ctx.data.remindMe) {
      ctx.data.remindMe = ""
      ctx.emits("remindmechange", null)
    }
  }
}