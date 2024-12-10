import cfg from "../../liu-config"
import type { CopyButtonProps } from "./types"

export function useCopyButton(
  props: CopyButtonProps,
) {

  const onTapCopyButton = async () => {
    const textToCopy = props.textToCopy || cfg.mainSiteLink
    await navigator.clipboard.writeText(textToCopy)
    const textAfterCopy = props.textAfterCopy || `已复制: ${textToCopy}`
    alert(textAfterCopy)
  }

  return {
    onTapCopyButton,
  }
}