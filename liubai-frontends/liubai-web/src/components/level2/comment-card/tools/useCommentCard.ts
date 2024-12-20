import liuApi from "~/utils/liu-api";
import type { 
  CommentCardProps,
  CcReactionItem,
  CcData,
} from "./types";
import { computed, reactive, ref, watch } from "vue";
import cui from "~/components/custom-ui";
import { useGlobalStateStore } from '~/hooks/stores/useGlobalStateStore';
import liuUtil from "~/utils/liu-util";
import { 
  type RouteAndLiuRouter, 
  useRouteAndLiuRouter,
} from "~/routes/liu-router";
import { emojiList } from "~/config/emoji-list"
import { useTemporaryStore } from "~/hooks/stores/useTemporaryStore";
import valTool from "~/utils/basic/val-tool";
import { prepareToDelete } from "./useCommentOperation"

export function useCommentCard(
  props: CommentCardProps,
) {

  const ccData = reactive<CcData>({
    reactionList: [],
    myReaction: {
      iconName: "",
      emoji: "",
    },
  })

  initReactions(props, ccData)

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
    const { target } = e
    if(!allowHover.value) return
    if(liuApi.eventTargetIsSomeTag(target, "a")) return
    if(liuApi.getSelectionText()) return
    if(gStore.isJustSelect()) return

    const cha = liuApi.getCharacteristic()

    if(cha.isMobile) {
      toContentPanel(props, rr)
    }
    else {
      toCommentDetail(props, rr)
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
    onTapCccCover,
    ccData,
  }
}

async function toContentPanel(
  props: CommentCardProps,
  rr: RouteAndLiuRouter,
) {
  const res = await cui.showContentPanel({ comment: props.cs, onlyReaction: false })
  if(res?.toReply) {
    // waiting for content-panel to close for 250ms
    await valTool.waitMilli(250)
    const tempStore = useTemporaryStore()
    tempStore.setFocusCommentEditor()
    toCommentDetail(props, rr)
  }

  if(res?.toEdit) {
    // waiting for content-panel to close for 250ms
    await valTool.waitMilli(250)
    const cs = props.cs
    cui.showCommentPopup({ operation: "edit_comment", commentShow: cs })
  }

  if(res?.toDelete) {
    await valTool.waitMilli(250)
    prepareToDelete(props.cs)
  }

}

function toCommentDetail(
  props: CommentCardProps,
  rr: RouteAndLiuRouter,
) {
  const cid2 = props.cs._id
  let opt = { rr }
  liuUtil.open.openComment(cid2, opt)
}


function initReactions(
  props: CommentCardProps,
  ccData: CcData,
) {

  // 处理 ccData.reactionList
  watch(() => props.cs, (newV) => {
    if(!newV) return

    const { myEmoji, emojiData } = newV
    const { total, system: systemList } = emojiData
    if(!total || systemList.length < 1) {
      ccData.reactionList = []
      return
    }

    const tmpList: CcReactionItem[] = []
    for(let i=0; i<systemList.length; i++) {
      const v = systemList[i]
      if(!v.num) continue

      const _emoji = liuApi.decode_URI_component(v.encodeStr)
      const data = emojiList.find(v1 => v1.emoji === _emoji)
      const item: CcReactionItem = {
        iconName: data?.iconName ?? "",
        emoji: data?.emoji ?? _emoji,
        emojiEncoded: v.encodeStr,
        num: v.num,
        chosen: v.encodeStr === myEmoji,
      }
      tmpList.push(item)
    }
    ccData.reactionList = tmpList
  }, { immediate: true })

  // 处理 ccData.myReaction
  watch(() => props.cs, (newV) => {
    if(!newV) return

    const { myEmoji } = newV
    if(!myEmoji) {
      ccData.myReaction = {
        iconName: "",
        emoji: "",
      }
      return
    }

    const _emoji = liuApi.decode_URI_component(myEmoji)
    const data = emojiList.find(v => v.emoji === _emoji)
    ccData.myReaction.iconName = data?.iconName ?? ""
    ccData.myReaction.emoji = data?.emoji ?? _emoji
  }, { immediate: true })
}


function onTapCccCover() {
  cui.showSnackBar({ 
    text_key: "comment.whatever",
    duration: 3000,
  })
}


function initSomeVals(
  props: CommentCardProps,
) {
  const allowHover = computed(() => {
    if(props.isTargetComment) return false
    if(props.location === "popup") return false
    if(props.cs.oState !== "OK") return false
    return true
  })

  const hoverColor = computed(() => {
    if(props.isTargetComment) return "transparent"
    if(props.location === "popup") return "transparent"
    if(props.cs.oState !== "OK") return "transparent"
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
    if(props.cs.oState !== "OK") return false
    const cha = liuApi.getCharacteristic()
    if(cha.isMobile) return false
    return true
  })

  const showBubbleBar = ref(false)

  // 当前 container 被隐藏时，去关闭 bubble-bar
  watch(() => props.isShowing, (newV) => {
    if(!newV && showBubbleBar.value) {
      showBubbleBar.value = false
    }
  })

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

