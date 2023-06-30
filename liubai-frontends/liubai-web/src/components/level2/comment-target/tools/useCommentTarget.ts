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



// 1. 加载【目标评论】
function loadTargetComment(
  ctData: CommentTargetData,
  emit: CommentTargetEmit,
) {



}

// 2. 加载【向下评论】


// 3. 加载【溯源评论】（向上）


// 4. 加载最顶部的 thread