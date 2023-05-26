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
import { db } from "~/utils/db";
import type { StorageState } from "~/types/types-basic";
import type { ContentLocalTable } from "~/types/types-table";

export function handleComment(
  props: CeProps, 
  ceCtx: CeCtx,
  editorRef: ShallowRef<TipTapEditor | undefined>,
) {

  const editor = editorRef.value
  if(!editor) return

  const wStore = useWorkspaceStore()
  if(!wStore.memberId) return

  const tStore = useThreadShowStore()

  const ctx: HcCtx = {
    wStore,
    tStore,
    ceCtx,
    props,
    editor,
  }

  if(props.commentId) toUpdate(ctx)
  else toRelease(ctx)
}

function toUpdate(
  ctx: HcCtx
) {
  
  

}

function toRelease(
  ctx: HcCtx
) {
  const { local_id: user } = localCache.getLocalPreference()
  if(!user) return


  

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
    s = await _toGetSuperior(commentId)
    if(s) return s
  }
  if(replyToComment) {
    s = await _toGetSuperior(replyToComment)
    if(s) return s
  }
  if(parentComment) {
    s = await _toGetSuperior(parentComment)
    if(s) return s
  }
  if(parentThread) {
    s = await _toGetSuperior(parentThread)
    if(s) return s
  }

  return
}

async function _toGetSuperior(id: string) {
  const res = await db.contents.get(id)
  return res
}