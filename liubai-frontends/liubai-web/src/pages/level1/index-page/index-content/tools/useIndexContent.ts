import { onActivated, onDeactivated, ref } from "vue";
import type { TrueOrFalse } from "~/types/types-basic";
import type { TlHasDataOpt } from "~/components/level1/thread-list/tools/types";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { usePrefix } from "~/hooks/useCommon";

export function useIndexContent() {
  const rr = useRouteAndLiuRouter()
  const showTxt = ref<TrueOrFalse>("T")
  const showTitle = ref(false)
  const calendarTitleKey = ref("")
  const onCalendarHasData = (opt?: TlHasDataOpt) => {
    showTitle.value = true
    calendarTitleKey.value = opt?.title_key ?? ""
  }

  const { prefix } = usePrefix()
  const onTapViewCalendar = () => {
    rr.router.push(`${prefix.value}schedule`)
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
    onTapViewCalendar,
  }
}