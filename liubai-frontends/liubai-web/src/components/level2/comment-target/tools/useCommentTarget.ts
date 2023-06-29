import { reactive, toRef, watch } from "vue";
import type { 
  CommentTargetData,
  CommentTargetEmit, 
  CommentTargetProps,
} from "./types";

export function useCommentTarget(
  props: CommentTargetProps,
  emit: CommentTargetEmit
) {

  const ctData = reactive<CommentTargetData>({
    targetId: "",
    state: 0,
    aboveList: [],
    belowList: [],
  })

  const rid = toRef(props, "targetId")
  watch(rid, (newV) => {
    ctData.targetId = newV
    loadTargetComment(ctData, emit)
  }, { immediate: true })


  return {
    ctData,
  }
}

function loadTargetComment(
  ctData: CommentTargetData,
  emit: CommentTargetEmit,
) {



}