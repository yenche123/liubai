import { reactive, toRef, watch } from "vue";
import type { 
  CommentTargetData,
  CommentTargetEmit, 
  CommentTargetProps,
} from "./types";
import type { LoadByCommentOpt } from "~/utils/controllers/comment-controller/tools/types"
import commentController from "~/utils/controllers/comment-controller/comment-controller";
import usefulTool from "~/utils/basic/useful-tool"
import threadController from "~/utils/controllers/thread-controller/thread-controller";

export function useCommentTarget(
  props: CommentTargetProps,
  emit: CommentTargetEmit
) {

  const ctData = reactive<CommentTargetData>({
    targetId: "",
    state: 0,
    aboveList: [],
    belowList: [],
    hasReachedBottom: false,
    hasReachedTop: false,
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
async function loadTargetComment(
  ctData: CommentTargetData,
  emit: CommentTargetEmit,
) {

  if(ctData.targetComment) {
    ctData.state = 1
  }
  else {
    ctData.state = 0
  }

  const opt: LoadByCommentOpt = {
    commentId: ctData.targetId,
    loadType: "target",
  }
  const res = await commentController.loadByComment(opt)
  const c = res[0]
  if(c?.oState !== "OK") {
    emit("pagestatechange", 50)
    return
  }

  console.log("加载到目标评论: ")
  console.log(c)
  console.log(" ")

  delete ctData.thread
  ctData.targetComment = c
  ctData.aboveList = []
  ctData.belowList = []
  ctData.hasReachedBottom = false
  ctData.hasReachedTop = false
  
  loadBelowList(ctData, emit)
}

// 2. 加载【向下评论】
async function loadBelowList(
  ctData: CommentTargetData,
  emit: CommentTargetEmit,
) {
  const opt: LoadByCommentOpt = {
    commentId: ctData.targetId,
    loadType: "find_children",
  }
  const tmpList = ctData.belowList
  const tmpLength = tmpList.length
  const lastComment = tmpList[tmpLength - 1]
  if(lastComment) {
    opt.lastItemStamp = lastComment.createdStamp
  }

  const newList = await commentController.loadByComment(opt)

  console.log("loadBelowList 结果: ")
  console.log(newList)
  console.log(" ")

  if(lastComment) {
    usefulTool.filterDuplicated(ctData.belowList, newList)
    commentController.handleRelation(newList, lastComment)
    ctData.belowList.push(...newList)
  }
  else {
    commentController.handleRelation(newList, ctData.targetComment)
    ctData.belowList = newList
  }

  if(newList.length < 5) {
    ctData.hasReachedBottom = true
  }

  // 判断是否要去溯源
  if(ctData.aboveList.length < 1 && !ctData.hasReachedTop) {
    loadAboveList(ctData, emit)
  }
}


// 3. 加载【溯源评论】（向上）
async function loadAboveList(
  ctData: CommentTargetData,
  emit: CommentTargetEmit,
) {
  let parentWeWant = ""
  let grandparent: string | undefined

  const c = ctData.targetComment
  const tmpList = ctData.aboveList
  const topComment = tmpList[0]
  if(topComment) {
    parentWeWant = topComment.replyToComment ?? ""
    grandparent = topComment.parentComment
  }
  else if(c) {
    parentWeWant = c.replyToComment ?? ""
    grandparent = c.parentComment
  }

  if(!parentWeWant) {
    loadThread(ctData, emit)
    return
  }

  const opt: LoadByCommentOpt = {
    commentId: ctData.targetId,
    loadType: "find_parent",
    parentWeWant,
    grandparent,
  }
  const newList = await commentController.loadByComment(opt)
  usefulTool.filterDuplicated(ctData.aboveList, newList)

  console.log("loadAboveList 结果: ")
  console.log(newList)
  console.log(" ")

  if(topComment) {
    commentController.handleRelation(newList, undefined, topComment)
    ctData.aboveList.splice(0, 0, ...newList)
  }
  else {
    commentController.handleRelation(newList, undefined, ctData.targetComment)
    ctData.aboveList = newList
  }

  // 判断是否要去加载 thread 了
  const newRe = newList[0]?.replyToComment
  if(!newRe && !ctData.hasReachedTop) {
    loadThread(ctData, emit)
  }
}


// 4. 加载最顶部的 thread
async function loadThread(
  ctData: CommentTargetData,
  emit: CommentTargetEmit,
) {
  const id = ctData.targetComment?.parentThread
  if(!id) return

  const res = await threadController.getData({ id })

  console.log("loadThread 结果......")
  console.log(res)
  console.log(" ")

  ctData.hasReachedTop = true
  ctData.thread = res
}