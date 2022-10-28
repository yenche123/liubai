import { reactive } from "vue";
import type { LiuRemindMe } from "../../../../types/types-atom"

interface MoreAreaEmits {
  (event: "whenchange", val: Date | null): void
  (event: "remindmechange", val: LiuRemindMe): void
}

export function useMoreArea() {

  // 仅存储 "UI" 信息即可，逻辑原子化信息会回传至 custom-editor
  const data = reactive({
    when: "",       // 什么时候
    remindMe: "",   // 提醒我
    title: "",      // 标题
    attachment: "",  // 附件名称
  })


  return { data }
}