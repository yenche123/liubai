import type { CommentShow, MemberShow } from "~/types/types-content";
import type { 
  CollectionLocalTable, 
  ContentLocalTable 
} from "~/types/types-table";
import type { TipTapJSONContent } from "~/types/types-editor";
import imgHelper from "../files/img-helper";
import transferUtil from "../transfer-util";
import commonPack from "../controllers/tools/common-pack";
import type { WorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import liuUtil from "../liu-util";

// 封装 content 成 CommentShow
function packComment(
  content: ContentLocalTable,
  collections: CollectionLocalTable[] | undefined,
  creator: MemberShow | undefined,
  user_id: string | undefined,
) {

  const v = content
  const { member, _id, user, liuDesc, spaceId } = v

  let myEmoji = ""
  let myEmojiStamp: number | undefined

  collections?.forEach(v2 => {
    if(v2.infoType === "EXPRESS" && v2.emoji) {
      myEmoji = v2.emoji
      myEmojiStamp = v2.insertedStamp
    }
  })

  let isMine = false
  if(user && user_id && user === user_id) isMine = true

  const images = v.images?.map(v2 => {
    return imgHelper.imageStoreToShow(v2)
  })

  const desc = transferUtil.tiptapToText(liuDesc ?? [])
  const newDesc = commonPack.packLiuDesc(liuDesc)
  const tiptapContent: TipTapJSONContent | undefined = 
    newDesc?.length ? { type: "doc", content: newDesc } : undefined

  const obj: CommentShow = {
    _id,
    cloud_id: v.cloud_id,
    insertedStamp: v.insertedStamp,
    updatedStamp: v.updatedStamp,
    oState: v.oState,
    user_id: user,
    member_id: member,
    spaceId,
    spaceType: v.spaceType,
    visScope: v.visScope,
    storageState: v.storageState,
    content: tiptapContent,
    summary: commonPack.getSummary(liuDesc, v.files),
    desc,
    images,
    files: v.files,
    creator,
    isMine,
    myEmoji,
    myEmojiStamp,
    commentNum: v.levelOneAndTwo ?? 0,
    emojiData: v.emojiData,
    createdStamp: v.createdStamp,
    editedStamp: v.editedStamp,
    createdStr: liuUtil.showBasicDate(v.createdStamp),
    editedStr: liuUtil.getEditedStr(v.createdStamp, v.editedStamp),
    parentThread: v.parentThread ?? "",
    parentComment: v.parentComment,
    replyToComment: v.replyToComment,
  }

  return obj
}

export default {
  packComment,
}