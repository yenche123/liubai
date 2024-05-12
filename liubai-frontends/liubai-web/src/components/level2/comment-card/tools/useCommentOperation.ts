import type { CommentOperation } from "~/types/types-atom"
import type { CommentCardProps } from "./types"
import cui from "~/components/custom-ui"
import type { CommentShow } from "~/types/types-content"
import contentOperate from "~/hooks/content/content-operate"
import { db } from "~/utils/db"
import { 
  useCommentStore, 
  type CommentStoreSetDataOpt 
} from "~/hooks/stores/useCommentStore"
import valTool from "~/utils/basic/val-tool"
import time from "~/utils/basic/time"
import type { ContentLocalTable } from "~/types/types-table"
import liuUtil from "~/utils/liu-util"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud"

export function useCommentOperation(
  props: CommentCardProps
) {

  const receiveOperation = (op: CommentOperation) => {
    const cs = props.cs

    if(op === "emoji") {
      handleEmoji(cs)
    }
    else if(op === "comment") {
      cui.showCommentPopup({ operation: "reply_comment", commentShow: cs })
    }
    else if(op === "share") {

    }
    else if(op === "edit") {
      cui.showCommentPopup({ operation: "edit_comment", commentShow: cs })
    }
    else if(op === "delete") {
      prepareToDelete(cs)
    }

  }

  const onTapReaction = (
    encodeStr: string, chosen: boolean
  ) => {
    const cs = props.cs
    if(chosen) {
      // 去取消
      contentOperate.toEmoji(cs._id, "COMMENT", "", undefined, cs)
    }
    else {
      // 去表态
      contentOperate.toEmoji(cs._id, "COMMENT", encodeStr, undefined, cs)
    }
  }
  
  return {
    receiveOperation,
    onTapReaction,
  }
}


function handleEmoji(
  cs: CommentShow
) {
  const { myEmoji } = cs
  if(myEmoji) {
    // 去取消
    contentOperate.toEmoji(cs._id, "COMMENT", "", undefined, cs)
  }
  else {
    cui.showContentPanel({ comment: cs, onlyReaction: true })
  }
}


async function prepareToDelete(
  cs: CommentShow,
) {
  const res = await cui.showModal({
    title_key: "comment.delete_tip2",
    content_key: "comment.delete_tip3",
    confirm_key: "common.delete",
    modalType: "warning"
  })
  if(!res.confirm) return

  // 0. get old content
  const id = cs._id
  const oldContent = await db.contents.get(id)
  if(!oldContent) return

  // 1. update CommentShow
  const now = time.getTime()
  const newCs = valTool.copyObject(cs)
  newCs.oState = "DELETED"
  newCs.updatedStamp = now

  // 2. update data
  const cfg = oldContent.config ?? {}
  cfg.lastOStateStamp = now
  const u: Partial<ContentLocalTable> = { 
    oState: "DELETED",
    updatedStamp: now,
    config: cfg,
  }
  const res2 = await db.contents.update(id, u)

  // 3. 修改上级的评论数
  await _modifySuperiorCommentNum(newCs)

  // 4. 全局通知各组件
  const cStore = useCommentStore()
  const obj: CommentStoreSetDataOpt = {
    changeType: "delete",
    commentId: id,
    commentShow: newCs,
    parentThread: newCs.parentThread,
    parentComment: newCs.parentComment,
    replyToComment: newCs.replyToComment,
  }
  cStore.setData(obj)

  // 5. snackbar（不带 undo）
  cui.showSnackBar({ text_key: "tip.deleted" })

  // 6. upload
  const isLocal = liuUtil.check.isLocalContent(newCs.storageState)
  if(isLocal) return
  const everSync = liuUtil.check.hasEverSynced(newCs)
  if(!everSync) return
  LocalToCloud.addTask({
    uploadTask: "comment-delete",
    target_id: id,
    operateStamp: now,
  })
}

/**
 * 去判断修改哪些上级的评论数
 * 逻辑与 handle-comment 相似
 * @param cs 
 */
async function _modifySuperiorCommentNum(
  cs: CommentShow
) {
  const { parentThread, parentComment, replyToComment } = cs
  if(parentThread && !parentComment && !replyToComment) {
    await _deleteCommentNum(parentThread)
    return true
  }

  if(replyToComment) {
    await _deleteCommentNum(replyToComment)
  }

  if(parentComment) {
    if(parentComment !== replyToComment) {
      await _deleteCommentNum(parentComment, 0, 1)
    }
    else {
      await _deleteCommentNum(parentThread, 0, 1)
    }
  }

  return true
  
}

async function _deleteCommentNum(
  id: string,
  levelOne: number = 1,
  levelOneAndTwo: number = 1,
) {
  const res = await db.contents.get(id)
  if(!res) return false

  let num1 = valTool.minusAndMinimumZero(res.levelOne, levelOne)
  let num2 = valTool.minusAndMinimumZero(res.levelOneAndTwo, levelOneAndTwo)
  let obj = {
    levelOne: num1,
    levelOneAndTwo: num2,
  }

  const res2 = await db.contents.update(id, obj)
  return true
}