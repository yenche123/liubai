// 发表或更新评论的逻辑

import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { CeProps, CeCtx, HcCtx } from "./types";
import type { ShallowRef } from "vue";
import type { TipTapEditor } from "~/types/types-editor"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import localCache from "~/utils/system/local-cache";
import time from "~/utils/basic/time";
import transferUtil from "~/utils/transfer-util";
import liuUtil from "~/utils/liu-util";
import type { ContentLocalTable } from "~/types/types-table";
import ider from "~/utils/basic/ider";
import localReq from "./req/local-req"

export function handleComment(
  props: CeProps, 
  ceCtx: CeCtx,
  editorRef: ShallowRef<TipTapEditor | undefined>,
) {

  const editor = editorRef.value
  if(!editor) return

  const wStore = useWorkspaceStore()
  if(!wStore.memberId) return

  const { local_id: user } = localCache.getLocalPreference()
  if(!user) return

  const tStore = useThreadShowStore()

  const ctx: HcCtx = {
    wStore,
    tStore,
    ceCtx,
    props,
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

  const res = await localReq.updateContent(id, preComment)
  console.log("查看 update 的结果: ")
  console.log(res)
  console.log(" ")
  
  

}

async function toRelease(
  ctx: HcCtx
) {
  const preComment = await _getCommentData(ctx)
  console.log("toRelease 入库前，看一下 preComment: ")
  console.log(preComment)
  console.log(" ")

  // 1. 添加进 contents 表里
  const res = await localReq.addContent(preComment as ContentLocalTable)
  console.log("查看添加进 contents 的结果: ")
  console.log(res)
  console.log(" ")

  // 2. 修改 
  _modifySuperiorCommentNum(ctx.props)

  // 3. 重置
  _reset(ctx)

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

  if(parentComment && parentComment !== replyToComment) {
    await _addCommentNum(parentComment, 1, 0)
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
  const { editor } = ctx
  editor.chain().setContent('<p></p>').run()
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
  const search_other = (transferUtil.tiptapToText(liuDesc)).toLowerCase()

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

    aComment._id = ider.createCommentId()
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
