import type {
  ThreadShow,
  CommentShow,
} from "~/types/types-content"


export function turnThreadIntoComment(
  ts: ThreadShow
) {
  const cs: CommentShow = {
    _id: ts._id,
    cloud_id: ts.cloud_id,
    _old_id: ts._old_id,
    insertedStamp: ts.insertedStamp,
    updatedStamp: ts.updatedStamp,
    oState: ts.oState,
    user_id: ts.user_id,
    member_id: ts.member_id,
    spaceId: ts.spaceId,
    spaceType: ts.spaceType,
    visScope: ts.visScope,
    storageState: ts.storageState,
    content: ts.briefing ? ts.briefing : ts.content,
    summary: ts.summary,
    desc: ts.desc,
    images: ts.images,
    files: ts.files,
    creator: ts.creator,
    isMine: ts.isMine,
    myEmoji: ts.myEmoji,
    myEmojiStamp: ts.myEmojiStamp,
    commentNum: ts.commentNum,
    emojiData: ts.emojiData,
    createdStamp: ts.createdStamp,
    editedStamp: ts.editedStamp,
    createdStr: ts.createdStr,
    editedStr: ts.editedStr,
    parentThread: "",
  }
  return cs
}