import liuApi from "~/utils/liu-api";
import type { CommentCardProps } from "./types";
import { computed, ref } from "vue";

export function useCommentCard(
  props: CommentCardProps,
) {

  const {
    allowHover,
    hoverColor,
  } = initSomeVals(props)

  const {
    enableActionbar,
    showActionbar,
    onMouseEnterComment,
    onMouseLeaveComment,
  } = initActionbar(props)
  
  return {
    allowHover,
    hoverColor,
    enableActionbar,
    showActionbar,
    onMouseEnterComment,
    onMouseLeaveComment,
  }
}


function initSomeVals(
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
    hoverColor
  }

}

function initActionbar(
  props: CommentCardProps,
) {

  const enableActionbar = computed(() => {
    if(props.location === 'popup') return false
    const cha = liuApi.getCharacteristic()
    if(cha.isMobile) return false
    return true
  })


  const showActionbar = ref(false)


  const onMouseEnterComment = () => {
    showActionbar.value = true
  }

  const onMouseLeaveComment = () => {

  }

  return {
    enableActionbar,
    showActionbar,
    onMouseEnterComment,
    onMouseLeaveComment,
  }
}

