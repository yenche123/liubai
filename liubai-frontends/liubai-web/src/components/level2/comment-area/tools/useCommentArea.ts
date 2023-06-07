import { reactive, watch } from "vue"
import type {
  CommentAreaProps,
  CommentAreaEmits,
  CommentAreaData,
} from "./types"
import commentCotroller from "~/utils/controllers/comment-controller/comment-controller"
import type {
  LoadByThreadOpt
} from "~/utils/controllers/comment-controller/tools/types"
import { useCommentStore } from "~/hooks/stores/useCommentStore"
import usefulTool from "~/utils/basic/useful-tool"
import { whenCommentAddOrDelete } from "./whenCommentAddOrDelete"

export function useCommentArea(
  props: CommentAreaProps,
  emit: CommentAreaEmits,
) {

  const caData = reactive<CommentAreaData>({
    comments: [],
    threadId: "",
  })

  // 监听 comment store
  // 当有新的评论时，添加在最前面
  const cStore = useCommentStore()
  cStore.$subscribe((mutation, state) => {
    whenCommentAddOrDelete(caData, state)
  })

  // 监听 props 的 threadId 改变
  watch(() => props.threadId, (newV) => {
    let reload = newV !== caData.threadId
    caData.threadId = newV
    loadComments(caData, reload)
  }, { immediate: true })

  return {
    caData,
  }
}

async function loadComments(
  caData: CommentAreaData,
  reload?: boolean,
) {

  let length = caData.comments.length

  const opt: LoadByThreadOpt = {
    targetThread: caData.threadId,
  }
  if(length > 0 && !reload) {
    opt.lastItemStamp = caData.comments[length - 1].createdStamp
  }

  const newList = await commentCotroller.loadByThread(opt)

  if(reload || length < 1) {
    caData.comments = newList
  }
  else {
    usefulTool.filterDuplicated(caData.comments, newList)
    caData.comments.push(...newList)
  }
  
}