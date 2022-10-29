import { reactive } from "vue";
import cui from "../../../custom-ui";
import type { LiuRemindMe } from "../../../../types/types-atom"
import liuUtil from "../../../../utils/liu-util";

interface MoreAreaEmits {
  (event: "whenchange", val: Date | null): void
  (event: "remindmechange", val: LiuRemindMe): void
}

interface MaData {
  when: string
  remindMe: string
  title: string
  attachment: string
}

interface MaContext {
  emits: MoreAreaEmits
  data: MaData
}

export function useMoreArea(emits: MoreAreaEmits) {

  // 仅存储 "UI" 信息即可，逻辑原子化信息会回传至 custom-editor
  const data = reactive<MaData>({
    when: "",       // 什么时候
    remindMe: "",   // 提醒我
    title: "",      // 标题
    attachment: "",  // 附件名称
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
    onTapWhen,
    onTapClearWhen,
  }
}


function setNewWhen(ctx: MaContext, date?: Date) {
  ctx.data.when = !date ? "" : liuUtil.showBasicDate(date)
  ctx.emits("whenchange", date ? date : null)
}