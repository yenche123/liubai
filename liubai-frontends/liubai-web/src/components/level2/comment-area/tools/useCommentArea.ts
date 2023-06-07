import { watch } from "vue"
import type {
  CommentAreaProps,
  CommentAreaEmits,
  CommentAreaCtx,
} from "./types"
import commentCotroller from "~/utils/controllers/comment-controller/comment-controller"
import type {
  LoadByThreadOpt
} from "~/utils/controllers/comment-controller/tools/types"

export function useCommentArea(
  props: CommentAreaProps,
  emit: CommentAreaEmits,
) {

  const ctx: CommentAreaCtx = {
    comments: [],
    threadId: props.threadId,
  }

  // 监听 comment store
  // 当有新的评论时，添加在最前面

  watch(() => props.threadId, (newV) => {
    ctx.threadId = newV
    loadComments(ctx)
  }, { immediate: true })

}

async function loadComments(
  ctx: CommentAreaCtx,
  reload?: boolean,
) {

  let length = ctx.comments.length

  const opt: LoadByThreadOpt = {
    targetThread: ctx.threadId,
  }
  if(length > 0 && !reload) {
    opt.lastItemStamp = ctx.comments[length - 1].createdStamp
  }

  const newList = await commentCotroller.loadByThread(opt)
  
}