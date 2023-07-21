import type { CommentOperation } from "~/types/types-atom"
import type { CommentCardProps } from "./types"
import cui from "~/components/custom-ui"

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

  }
  
  return {
    receiveOperation
  }
}