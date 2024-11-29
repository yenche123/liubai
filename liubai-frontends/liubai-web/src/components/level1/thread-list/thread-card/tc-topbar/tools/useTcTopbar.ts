import { computed } from "vue"
import type { TctProps } from "./types"
import type { TooltipPlacement } from "~/components/common/liu-tooltip/tools/types"
import cui from "~/components/custom-ui"
import { i18n } from "~/locales"

export function useTcTopbar(
  props: TctProps,
) {
  const td = computed(() => props.threadData)

  const aiCharacterUrl = computed(() => {
    const t = td.value
    const a = t.aiCharacter
    if(!a) return
    if(a === "deepseek") return "deepseek.svg"
    if(a === "kimi") return "kimi.png"
    if(a === "wanzhi") return "01-ai.png"
    if(a === "yuewen") return "yuewen.svg"
    if(a === "zhipu") return "zhipu.png"
  })

  const showTopbar = computed(() => {
    const t = td.value
    if(t.pinStamp) return true
    if(t.stateId && t.stateShow) return true
    if(t.storageState === `LOCAL` || t.storageState === `ONLY_LOCAL`) return true
    if(aiCharacterUrl.value) return true
    return false
  })

  const cloudOffPlacement = computed<TooltipPlacement>(() => {
    const t = td.value
    if(t.stateShow) return `bottom`
    return `bottom-end`
  })

  const onTapAiCharacter = () => {
    const _td = td.value
    const a = _td.aiCharacter
    if(!a) return
    const { t } = i18n.global
    const name = t(`ai_character.${a}`)
    const company = t(`ai_provider.${a}`)
    if(!name || !company) return
    let isTheSame = name === company
    let content = ""
    if(isTheSame) {
      content = t("thread_related.created_by_ai2", { name })
    }
    else {
      content = t("thread_related.created_by_ai", { name, company })
    }
    
    cui.showModal({
      title_key: "tip.tip",
      content,
      showCancel: false,
      confirm_key: "common.ok"
    })
  }


  return {
    td,
    showTopbar,
    cloudOffPlacement,
    aiCharacterUrl,
    onTapAiCharacter,
  }
}