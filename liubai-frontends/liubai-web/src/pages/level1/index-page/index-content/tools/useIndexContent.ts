import { onActivated, onDeactivated, ref } from "vue";
import type { TrueOrFalse } from "~/types/types-basic";
import type { TlHasDataOpt } from "~/components/level1/thread-list/tools/types";

export function useIndexContent() {
  const showTxt = ref<TrueOrFalse>("T")
  const showTitle = ref(false)
  const calendarTitleKey = ref("")
  const onCalendarHasData = (opt?: TlHasDataOpt) => {
    showTitle.value = true
    calendarTitleKey.value = opt?.title_key ?? ""
  }

  onActivated(() => {
    showTxt.value = "T"
  })

  onDeactivated(() => {
    showTxt.value = "F"
  })

  return {
    showTxt,
    showTitle,
    calendarTitleKey,
    onCalendarHasData,
  }
}