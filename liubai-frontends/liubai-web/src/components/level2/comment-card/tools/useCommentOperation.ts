import type { CommentOperation } from "~/types/types-atom"
import type { CommentCardProps } from "./types"
import cui from "~/components/custom-ui"
import { CommentShow } from "~/types/types-content"

export function useCommentOperation(
  props: CommentCardProps
) {

  const receiveOperation = (op: CommentOperation) => {
    const cs = props.cs
    
    console.log("receiveOperation...... ", op)

    if(op === "emoji") {
      cui.showContentPanel({ comment: cs, onlyReaction: true })
      return
    }
    else if(op === "comment") {

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