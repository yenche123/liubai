import liuApi from "~/utils/liu-api";
import type { CommentCardProps } from "./types";
import { computed, ref } from "vue";
import cui from "~/components/custom-ui";
import { useGlobalStateStore } from '~/hooks/stores/useGlobalStateStore';

export function useCommentCard(
  props: CommentCardProps,
) {

  const gStore = useGlobalStateStore()

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


  const onTapContainer = (e: MouseEvent) => {
    const { target, currentTarget } = e
    if(!allowHover.value) return
    if(liuApi.eventTargetIsSomeTag(target, "a")) return
    if(liuApi.getSelectionText()) return
    if(gStore.isJustSelect()) return

    const cha = liuApi.getCharacteristic()

    cui.showContentPanel({ comment: props.cs, onlyReaction: false })
    // if(cha.isMobile) {
    //   cui.showContentPanel({ comment: props.cs, onlyReaction: false })
    // }
  }

  
  return {
    allowHover,
    hoverColor,
    enableActionbar,
    showActionbar,
    onMouseEnterComment,
    onMouseLeaveComment,
    onTapContainer,
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
    return "var(--comment-hover-two)"
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
    showActionbar.value = false
  }

  return {
    enableActionbar,
    showActionbar,
    onMouseEnterComment,
    onMouseLeaveComment,
  }
}

