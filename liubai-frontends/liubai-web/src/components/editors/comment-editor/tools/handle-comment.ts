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

export function handleComment(
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

  const ctx: HcCtx = {
    wStore,
    ceCtx,
    props,
    emit,
    editor,
    user,
  }

  if(props.commentId) toUpdate(ctx)
  else toRelease(ctx)
}

async function toUpdate(
  ctx: HcCtx
) {

  const id = ctx.props.commentId as string
  const preComment = await _getCommentData(ctx)
  console.log("toUpdate 入库前，看一下 preComment: ")
  console.log(preComment)
  console.log(" ")

  // 1. 更新到 db 里
  const res = await localReq.updateContent(id, preComment)
  console.log("查看 update 的结果: ")
  console.log(res)
  console.log(" ")

  // 2. 重置
  _reset(ctx)
  
  // 3. 从 db 里获取最新的 CommentShow
  const [newComment] = await commentController.loadByComment({ commentId: id, loadType: "target" })
  if(!newComment) {
    console.warn("没有查找到更新后的评论.............")
    return
  }

  // 4. 通知其他组件
  const cStore = useCommentStore()
  const opt: CommentStoreSetDataOpt = {
    changeType: "edit",
    commentId: newComment._id,
    commentShow: newComment,
    parentThread: newComment.parentThread,
    parentComment: newComment.parentComment,
    replyToComment: newComment.replyToComment,
  }
  cStore.setData(opt)

  // 5. 用 emit 通知上级
  ctx.emit("finished")
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
  const opt: CommentStoreSetDataOpt = {
    changeType: "add",
    commentId: newComment._id,
    commentShow,
    parentThread: ctx.props.parentThread,
    parentComment: ctx.props.parentComment,
    replyToComment: ctx.props.replyToComment,
  }
  cStore.setData(opt)

  // 6. 用 emit 通知上级
  ctx.emit("finished")
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
  let num1 = res.levelOne ?? 0
  let num2 = res.levelOneAndTwo ?? 0
  num1 += levelOne
  num2 += levelOneAndTwo
  let obj = {
    levelOne: num1,
    levelOneAndTwo: num2,
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
  if(storageState === "CLOUD") {
    storageState = "WAIT_UPLOAD"
  }

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
