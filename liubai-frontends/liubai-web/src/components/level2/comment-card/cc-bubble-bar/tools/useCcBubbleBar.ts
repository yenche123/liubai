import cui from "~/components/custom-ui"
import type { CcBubbleBarProps } from "./types"

// 响应评论卡片里工具栏的操作
export function useCcBubbleBar(
  props: CcBubbleBarProps
) {

  const onTapEmoji = () => {
    cui.showContentPanel({ comment: props.cs, onlyReaction: true })
  }

  const onTapReply = () => {

  }


  const onTapShare = () => {

  }


  return {
    onTapEmoji,
    onTapReply,
    onTapShare,
  }
}