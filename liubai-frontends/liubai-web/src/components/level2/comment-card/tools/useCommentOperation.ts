import type { CommentOperation } from "~/types/types-atom"
import type { CommentCardProps } from "./types"
import cui from "~/components/custom-ui"
import type { CommentShow } from "~/types/types-content"
import contentOperate from "~/hooks/content/content-operate"

export function useCommentOperation(
  props: CommentCardProps
) {

  const receiveOperation = (op: CommentOperation) => {
    const cs = props.cs

    if(op === "emoji") {
      handleEmoji(cs)
    }
    else if(op === "comment") {
      cui.showCommentPopup({ operation: "reply_comment", commentShow: cs })
    }
    else if(op === "share") {

    }
    else if(op === "edit") {

    }
    else if(op === "delete") {
      prepareToDelete(cs)
    }

  }
  
  return {
    receiveOperation
  }
}


function handleEmoji(
  cs: CommentShow
) {
  const { myEmoji } = cs
  if(myEmoji) {
    // 去取消
    contentOperate.toEmoji(cs._id, "COMMENT", "", undefined, cs)
  }
  else {
    cui.showContentPanel({ comment: cs, onlyReaction: true })
  }
}

function handleComment(
  cs: CommentShow,
) {


}

function handleShare(
  cs: CommentShow,
) {

}

function handleEdit(
  cs: CommentShow,
) {

}


async function prepareToDelete(
  cs: CommentShow,
) {
  const res = await cui.showModal({
    title_key: "comment.delete_tip2",
    content_key: "comment.delete_tip3",
    confirm_key: "common.delete",
    modalType: "warning"
  })
  if(!res.confirm) return

}