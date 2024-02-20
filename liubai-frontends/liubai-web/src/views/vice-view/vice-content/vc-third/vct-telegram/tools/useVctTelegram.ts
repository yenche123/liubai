import type { VctCommonProps } from "../../tools/types"
import thirdLink from '~/config/third-link';
import { useThirdScript, type ThirdScriptAttr } from '../../tools/useThirdScript';
import { useSystemStore } from "~/hooks/stores/useSystemStore";
import { storeToRefs } from "pinia";

export function useVctTelegram(
  props: VctCommonProps,
) {

  const systemStore = useSystemStore()
  const { supported_theme: theme } = storeToRefs(systemStore)

  // 从 path 里获取 postId
  const _getPostId = () => {
    const link = props.link
    if(!link) return
    const url = new URL(link)
    const p = url.pathname
    if(p.length < 3) return
    return p.substring(1)
  }

  const postId = _getPostId()
  if(!postId) {
    return {}
  }

  const attrs: ThirdScriptAttr[] = [
    {
      name: "data-telegram-post",
      value: postId,
    },
    {
      name: "data-width",
      value: "100%",
    },
    {
      name: "data-userpic",
      value: "false"
    },
    {
      name: "data-color",   // 浅色模式的主题
      value: "#2a6885",     // 与 var(--primary-color) 一致
    },
    {
      name: "data-dark-color",          // 深色模式的主题
      value: "#88d1ff",    // 与 var(--primary-color) 一致
    }
  ]

  if(theme.value === 'dark') {
    attrs.push({ name: "data-dark", value: "1" })
  }

  const {
    boxRef
  } = useThirdScript(thirdLink.TELEGRAM_WIDGETS, attrs)


  return { boxRef }
}