// 发表或更新评论的逻辑

import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { CeProps, CeCtx, HcCtx, CeEmit } from "./types";
import type { ShallowRef } from "vue";
import type { TipTapEditor } from "~/types/types-editor"
import localCache from "~/utils/system/local-cache";
import time from "~/utils/basic/time";
import transferUtil from "~/utils/transfer-util";
import liuUtil from "~/utils/liu-util";
import type { ContentLocalTable } from "~/types/types-table";
import ider from "~/utils/basic/ider";
import localReq from "./req/local-req";
import { 
  useCommentStore, 
  type CommentStoreSetDataOpt,
} from "~/hooks/stores/useCommentStore";
import commentCache from "./comment-cache";
import { getStorageAtom } from "./useCommentEditor"
import { equipComments } from "~/utils/controllers/equip/comments"
import commentController from "~/utils/controllers/comment-controller/comment-controller";
import { LocalToCloud } from "~/utils/cloud/LocalToCloud";
import liuApi from "~/utils/liu-api";

export async function finishComment(
  props: CeProps,
  emit: CeEmit, 
  ceCtx: CeCtx,
  editorRef: ShallowRef<TipTapEditor | undefined>,
) {

  const editor = editorRef.value
  if(!editor) return

  const wStore = useWorkspaceStore()
  if(!wStore.memberId) return

  const { local_id: user } = localCache.getPreference()
  if(!user) return

  const newProps = await _getNewProps(props)
  const ctx: HcCtx = {
    wStore,
    ceCtx,
    props: newProps,
    emit,
    editor,
    user,
  }
  
  if(newProps.commentId) toUpdate(ctx)
  else toRelease(ctx)
}

async function toUpdate(
  ctx: HcCtx
) {
  const commentId = ctx.props.commentId as string
  const preComment = await _getCommentData(ctx)
  console.log("toUpdate 入库前，看一下 preComment: ")
  console.log(preComment)
  console.log(" ")

  // 1. 更新到 db 里
  const res = await localReq.updateContent(commentId, preComment)
  console.log("查看 update 的结果: ")
  console.log(res)
  console.log(" ")

  // 2. 重置
  _reset(ctx)
  
  // 3. 从 db 里获取最新的 CommentShow
  const [newComment] = await commentController.loadByComment({ 
    commentId, 
    loadType: "target",
  })
  if(!newComment) {
    console.warn("没有查找到更新后的评论.............")
    return
  }

  // 4. 通知其他组件
  const cStore = useCommentStore()
  const opt: CommentStoreSetDataOpt = {
    changeType: "edit",
    commentId,
    commentShow: newComment,
    parentThread: newComment.parentThread,
    parentComment: newComment.parentComment,
    replyToComment: newComment.replyToComment,
  }
  cStore.setData(opt)

  // 5. 用 emit 通知上级
  ctx.emit("finished")

  // 6. upload
  const isLocal = liuUtil.check.isLocalContent(newComment.storageState)
  if(isLocal) return
  const everSynced = liuUtil.check.hasEverSynced(newComment)
  LocalToCloud.addTask({
    uploadTask: everSynced ? "comment-edit" : "comment-post",
    target_id: commentId,
    operateStamp: newComment.editedStamp,
  })

}

async function toRelease(
  ctx: HcCtx
) {
  const preComment = await _getCommentData(ctx)
  const newComment = preComment as ContentLocalTable
  console.log("toRelease 入库前，看一下 preComment: ")
  console.log(preComment)
  console.log(" ")

  // 1. 添加进 contents 表里
  const res = await localReq.addContent(newComment)
  console.log("查看添加进 contents 的结果: ")
  console.log(res)
  console.log(" ")
  if(!res) {
    console.log("comment id 不存在............")
    return false
  }

  // 2. 修改 
  _modifySuperiorCommentNum(ctx.props)

  // 3. 重置
  _reset(ctx)

  // 4. 将 ContentLocalTable 转为 CommentShow
  const [commentShow] = await equipComments([newComment])

  // console.log("看一下 commentShow: ")
  // console.log(commentShow)
  // console.log(" ")

  // 5. 通知其他组件
  const cStore = useCommentStore()
  const commentId = newComment._id
  const opt: CommentStoreSetDataOpt = {
    changeType: "add",
    commentId,
    commentShow,
    parentThread: ctx.props.parentThread,
    parentComment: ctx.props.parentComment,
    replyToComment: ctx.props.replyToComment,
  }
  cStore.setData(opt)

  // 6. 用 emit 通知上级
  ctx.emit("finished")

  // 7. upload
  const isLocal = liuUtil.check.isLocalContent(newComment.storageState)
  if(isLocal) return
  LocalToCloud.addTask({
    uploadTask: "comment-post",
    target_id: commentId,
    operateStamp: newComment.editedStamp,
  })

}


// 修改上级的 评论数量
// 规则见 [README.md](/README.md)
async function _modifySuperiorCommentNum(props: CeProps) {
  const { parentThread, parentComment, replyToComment } = props

  if(parentThread && !parentComment && !replyToComment) {
    await _addCommentNum(parentThread)
    return true
  }

  if(replyToComment) {
    await _addCommentNum(replyToComment)
  }

  if(parentComment) {
    if(parentComment !== replyToComment) {
      await _addCommentNum(parentComment, 0, 1)
    }
    else {
      await _addCommentNum(parentThread, 0, 1)
    }
  }

  return true
}

async function _addCommentNum(
  id: string,
  levelOne: number = 1,
  levelOneAndTwo: number = 1,
) {
  const res = await localReq.getContent(id)
  if(!res) return false

  const now = time.getTime()
  const cfg = res.config ?? {}
  const oldStamp = cfg.lastUpdateLevelNum ?? 0
  if(now > oldStamp) {
    cfg.lastUpdateLevelNum = now
  }

  let num1 = res.levelOne ?? 0
  let num2 = res.levelOneAndTwo ?? 0
  num1 += levelOne
  num2 += levelOneAndTwo
  let obj: Partial<ContentLocalTable> = {
    levelOne: num1,
    levelOneAndTwo: num2,
    config: cfg,
  }
  const res2 = await localReq.updateContent(id, obj)
  console.log("看一下修改的结果.......")
  console.log(res2)
  console.log(" ")
  return true
}


function _reset(ctx: HcCtx) {
  const { editor, ceCtx, props } = ctx

  const atom = getStorageAtom(props)
  commentCache.toDelete(atom)

  ceCtx.lastFinishStamp = time.getTime()
  ceCtx.files = []
  ceCtx.images = []
  ceCtx.fileShowName = ""
  ceCtx.canSubmit = false
  delete ceCtx.editorContent
  editor.chain().setContent('<p></p>').run()

  const { located } = props
  const cha = liuApi.getCharacteristic()
  if(cha.isPC) return
  if(located === "main-view" || located === "vice-view") {
    ctx.ceCtx.isToolbarTranslateY = true
  }
}


async function _getCommentData(
  ctx: HcCtx,
) {
  const now = time.getTime()
  const { ceCtx, props, wStore } = ctx

  // 1. 处理内文
  const { editorContent } = ceCtx
  const contentJSON = editorContent?.json
  const list = contentJSON?.type === "doc" && contentJSON.content ? contentJSON.content : []
  const liuList = list.length > 0 ? transferUtil.tiptapToLiu(list) : undefined
  const liuDesc = liuUtil.getRawList(liuList)

  // 2. 处理 storageState
  const superior = await _getSuperior(props)
  let storageState = superior?.storageState ?? "WAIT_UPLOAD"

  // 3. 图片、文件
  const images = liuUtil.getRawList(ceCtx.images)
  const files = liuUtil.getRawList(ceCtx.files)
  
  // 4. 利于搜索
  const search_other = transferUtil.packSearchOther(list, files)

  const aComment: Partial<ContentLocalTable> = {
    infoType: "COMMENT",
    oState: "OK",
    visScope: "DEFAULT",
    storageState,
    liuDesc,
    images,
    files,
    updatedStamp: now,
    editedStamp: now,
    search_other,
  }

  // 没有 commentId 代表就是发表模式，必须设置
  // workspace insertedStamp createdStamp
  if(!props.commentId) {
    aComment.spaceId = superior?.spaceId ?? wStore.spaceId
    let _spaceType = superior?.spaceType ?? wStore.spaceType
    aComment.spaceType = _spaceType ? _spaceType : undefined
    aComment.createdStamp = now
    aComment.insertedStamp = now
    aComment.parentThread = props.parentThread
    aComment.parentComment = props.parentComment
    aComment.replyToComment = props.replyToComment

    const newId = ider.createCommentId()
    aComment._id = newId
    aComment.first_id = newId
    aComment.user = ctx.user
    aComment.member = ctx.wStore.memberId
    aComment.levelOne = 0
    aComment.levelOneAndTwo = 0
    aComment.emojiData = { total: 0, system: [] }

    if(storageState === "CLOUD") {
      aComment.storageState = "WAIT_UPLOAD"
    }
  }

  return aComment
}


// 向上获取 content
async function _getSuperior(
  props: CeProps
): Promise<ContentLocalTable | undefined> {
  const { 
    parentThread, 
    parentComment, 
    replyToComment, 
    commentId,
  } = props

  let s: ContentLocalTable | undefined
  if(commentId) {
    s = await localReq.getContent(commentId)
    if(s) return s
  }
  if(replyToComment) {
    s = await localReq.getContent(replyToComment)
    if(s) return s
  }
  if(parentComment) {
    s = await localReq.getContent(parentComment)
    if(s) return s
  }
  if(parentThread) {
    s = await localReq.getContent(parentThread)
    if(s) return s
  }

  return
}

async function _getNewProps(
  props: CeProps,
) {
  const newProps = { ...props }
  let { 
    commentId,
    parentThread, 
    parentComment, 
    replyToComment,
  } = newProps

  // 1. handle parentThread
  if(parentThread.startsWith("t0")) {
    const res1 = await localReq.getContentByFirstId(parentThread)
    // console.warn("_getNewProps res1: ")
    // console.log(res1)
    if(res1) parentThread = res1._id
  }

  // 2. handle parentComment
  let res2: ContentLocalTable | undefined
  if(parentComment && parentComment.startsWith("c0")) {
    res2 = await localReq.getContentByFirstId(parentComment)
    // console.warn("_getNewProps res2: ")
    // console.log(res2)
    if(res2) parentComment = res2._id
  }

  // 3. handle replyToComment
  if(res2 && res2.first_id === replyToComment) {
    replyToComment = res2._id
  }
  else if(replyToComment && replyToComment.startsWith("c0")) {
    const res3 = await localReq.getContentByFirstId(replyToComment)
    // console.warn("_getNewProps res3: ")
    // console.log(res3)
    if(res3) replyToComment = res3._id
  }

  // 4. handle commentId
  if(commentId && commentId.startsWith("c0")) {
    const res4 = await localReq.getContentByFirstId(commentId)
    // console.warn("_getNewProps res4: ")
    // console.log(res4)
    if(res4) commentId = res4._id
  }

  newProps.parentThread = parentThread
  newProps.parentComment = parentComment
  newProps.replyToComment = replyToComment
  newProps.commentId = commentId
  return newProps
}
