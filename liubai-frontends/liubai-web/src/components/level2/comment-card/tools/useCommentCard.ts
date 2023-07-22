import liuApi from "~/utils/liu-api";
import type { CommentCardProps } from "./types";
import { computed, ref } from "vue";
import cui from "~/components/custom-ui";
import { useGlobalStateStore } from '~/hooks/stores/useGlobalStateStore';
import liuUtil from "~/utils/liu-util";
import { useRouteAndLiuRouter } from "~/routes/liu-router";

export function useCommentCard(
  props: CommentCardProps,
) {

  const gStore = useGlobalStateStore()
  const rr = useRouteAndLiuRouter()

  const {
    allowHover,
    hoverColor,
  } = initSomeVals(props)

  const {
    enableBubbleBar,
    showBubbleBar,
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
    const cid2 = props.cs._id
    let opt = { rr }

    if(cha.isMobile) {
      cui.showContentPanel({ comment: props.cs, onlyReaction: false })
    }
    else {
      liuUtil.open.openComment(cid2, opt)
    }
  }

  
  return {
    allowHover,
    hoverColor,
    enableBubbleBar,
    showBubbleBar,
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

  const enableBubbleBar = computed(() => {
    if(props.location === 'popup') return false
    if(props.isTargetComment) return false
    const cha = liuApi.getCharacteristic()
    if(cha.isMobile) return false
    return true
  })


  const showBubbleBar = ref(false)


  const onMouseEnterComment = () => {
    showBubbleBar.value = true
  }

  const onMouseLeaveComment = () => {
    showBubbleBar.value = false
  }

  return {
    enableBubbleBar,
    showBubbleBar,
    onMouseEnterComment,
    onMouseLeaveComment,
  }
}

