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


async function _getThreadData(
  ctx: HcCtx,
) {
  const now = time.getTime()
  const { ceCtx, props } = ctx

  // 1. 处理内文
  const { editorContent } = ceCtx
  const contentJSON = editorContent?.json
  const list = contentJSON?.type === "doc" && contentJSON.content ? contentJSON.content : []
  const liuList = list.length > 0 ? transferUtil.tiptapToLiu(list) : undefined
  const liuDesc = liuUtil.getRawList(liuList)

  // 2. 处理 storageState
  



}