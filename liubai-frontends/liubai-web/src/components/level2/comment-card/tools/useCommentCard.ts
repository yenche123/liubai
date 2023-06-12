import type { CommentCardProps } from "./types";
import { computed } from "vue";

export function useCommentCard(
  props: CommentCardProps,
) {

  const allowHover = computed(() => {
    if(props.isTargetComment) return false
    if(props.location === "popup") return false
    return true
  })

  const hoverColor = computed(() => {
    if(props.isTargetComment) return "transparent"
    if(props.location === "popup") return "transparent"
    if(props.location === "detail-page") return "var(--comment-hover-two)"
    return "var(--comment-hover-one)"
  })
  
  return {
    allowHover,
    hoverColor,
  }
}