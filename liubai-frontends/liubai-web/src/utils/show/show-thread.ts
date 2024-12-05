import type { MemberShow } from "~/types/types-content";
import type { 
  CollectionLocalTable, 
  ContentLocalTable 
} from "~/types/types-table";
import type { TipTapJSONContent } from "~/types/types-editor";
import type { TagShow, ThreadShow, StateShow } from "~/types/types-content";
import imgHelper from "../files/img-helper";
import transferUtil from "../transfer-util";
import commonPack from "../controllers/tools/common-pack";
import { tagIdsToShows } from "../system/tag-related";
import liuUtil from "../liu-util";
import type { PackThreadOpt } from "./tools/types";

// 封装 thread 成 ThreadShow
function packThread(
  content: ContentLocalTable,
  collections: CollectionLocalTable[] | undefined,
  creator: MemberShow | undefined,
  opt: PackThreadOpt,
) {

  let v = content
  const { 
    member, 
    _id, 
    user, 
    liuDesc, 
    spaceId, 
    title,
  } = v

  let myFavorite = false
  let myFavoriteStamp: number | undefined
  let myEmoji = ""
  let myEmojiStamp: number | undefined

  collections?.forEach(v2 => {
    if(v2.infoType === "EXPRESS" && v2.emoji) {
      myEmoji = v2.emoji
      myEmojiStamp = v2.sortStamp ?? v2.insertedStamp
    }
    else if(v2.infoType === "FAVORITE") {
      myFavorite = v2.oState === "OK"
      myFavoriteStamp = v2.sortStamp ?? v2.insertedStamp
    }
  })

  let isMine = false
  if(user && opt.user_id && user === opt.user_id) isMine = true

  const images = v.images?.map(v2 => {
    return imgHelper.imageStoreToShow(v2)
  })

  const desc = transferUtil.tiptapToText(liuDesc ?? [])
  const newDesc = commonPack.packLiuDesc(liuDesc, title)
  const tiptapContent: TipTapJSONContent | undefined = 
    newDesc?.length ? { type: "doc", content: newDesc } : undefined

  let tags: TagShow[] = []
  let stateShow: StateShow | undefined = undefined
  // 判断当前工作区与当前动态是否匹配，若匹配则可展示标签和状态
  let canTag = spaceId === opt.wStore.spaceId
  // 如果动态所属的工作区与当前工作区匹配
  if(canTag) {
    const tagData = v.tagIds ? tagIdsToShows(v.tagIds) : undefined
    tags = tagData?.tagShows ?? []
    stateShow = commonPack.getStateShow(v.stateId, opt.wStore)
  }

  // 删除于 xxxx-xx-xx
  let removedStr: string | undefined
  if(v.oState === "REMOVED" && v.removedStamp) {
    removedStr = liuUtil.showBasicTime(v.removedStamp)
  }
  
  const obj: ThreadShow = {
    _id,
    first_id: v.first_id,
    insertedStamp: v.insertedStamp,
    updatedStamp: v.updatedStamp,
    oState: v.oState,
    user_id: user,
    member_id: member,
    spaceId,
    spaceType: v.spaceType,
    visScope: v.visScope,
    storageState: v.storageState,
    title,
    content: tiptapContent,
    briefing: commonPack.getBriefing(newDesc, opt),
    summary: commonPack.getSummary(liuDesc, v.files),
    desc,
    images,
    imgLayout: imgHelper.getImgLayout(images),
    files: v.files,

    calendarStamp: v.calendarStamp,
    whenStamp: v.whenStamp,
    remindStamp: v.remindStamp,
    remindMe: v.remindMe,
    creator,
    isMine,
    myFavorite,
    myFavoriteStamp,
    myEmoji,
    myEmojiStamp,
    commentNum: v.levelOneAndTwo ?? 0,
    emojiData: v.emojiData,
    pinStamp: v.pinStamp,

    createdStamp: v.createdStamp,
    editedStamp: v.editedStamp,
    removedStamp: v.removedStamp,

    createdStr: liuUtil.showBasicTime(v.createdStamp),
    editedStr: liuUtil.getEditedStr(v.createdStamp, v.editedStamp),
    removedStr,
    tags,
    tagSearched: v.tagSearched,
    stateId: v.stateId,
    stateShow,
    config: v.config,
    aiCharacter: v.aiCharacter,
    aiReadable: v.aiReadable,
  }
  return obj
}


export default {
  packThread,
}