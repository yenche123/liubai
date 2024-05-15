import type { 
  LiuDownloadContent, 
  LiuDownloadDraft, 
  LiuDownloadParcel, 
  LiuDownloadParcel_A, 
  LiuDownloadParcel_B,
} from "~/requests/req-types";
import type { LiuTable } from "~/types/types-atom";
import type {
  CollectionLocalTable, 
  ContentLocalTable, 
  DraftLocalTable, 
  MemberLocalTable,
  UserLocalTable,
} from "~/types/types-table";
import valTool from "~/utils/basic/val-tool";
import { db } from "~/utils/db";


let merged_content_ids: string[] = []
let merged_collection_ids: string[] = []
let merged_member_ids: string[] = []
let merged_user_ids: string[] = []

export async function handleLiuDownloadParcels(
  list: LiuDownloadParcel[]
) {
  if(list.length < 1) return

  const parcels_1: LiuDownloadParcel_A[] = []
  const parcels_2: LiuDownloadParcel_B[] = []
  list.forEach(v => {
    const p = v.parcelType
    if(p === "content") parcels_1.push(v)
    else if(p === "draft") parcels_2.push(v)
  })

  if(parcels_1.length > 0) {
    await handleContentParcels(parcels_1)
  }

  if(parcels_2.length > 0) {
    await handleDraftParcels(parcels_2)
  }

  
}

async function handleContentParcels(
  list: LiuDownloadParcel_A[],
) {
  let content_ids: string[] = []
  let collection_ids: string[] = []
  let member_ids: string[] = []
  let user_ids: string[] = []

  list.forEach(v => {
    content_ids.push(v.id)
    
    const d = v.content
    if(!d) return
    if(d.isMine) {
      if(d.myEmoji?._id) collection_ids.push(d.myEmoji._id)
      if(d.myFavorite?._id) collection_ids.push(d.myFavorite._id)
    }
    else {
      user_ids.push(d.author.user_id)
      if(d.author.member_id) member_ids.push(d.author.member_id)
    }
  })
  content_ids = valTool.uniqueArray(content_ids)
  collection_ids = valTool.uniqueArray(collection_ids)
  member_ids = valTool.uniqueArray(member_ids)
  user_ids = valTool.uniqueArray(user_ids)

  const local_contents = await getLocalRows<ContentLocalTable>(content_ids, "contents")
  const local_collections = await getLocalRows<CollectionLocalTable>(
    collection_ids, "collections"
  )
  const local_members = await getLocalRows<MemberLocalTable>(member_ids, "members")
  const local_users = await getLocalRows<UserLocalTable>(user_ids, "users")

  for(let i1=0; i1<list.length; i1++) {
    const v1 = list[i1]
    if(v1.status !== "has_data") continue
    const c1 = v1.content
    if(!c1) continue
    
    const hasMerged = merged_content_ids.includes(v1.id)
    if(hasMerged) continue
    
    const oldContent = local_contents.find(v => v._id === v1.id)
    let oldFavorite: CollectionLocalTable | undefined
    let oldEmoji: CollectionLocalTable | undefined
    let oldMember: MemberLocalTable | undefined
    let oldUser: UserLocalTable | undefined
    if(c1.myFavorite) {
      const f_id = c1.myFavorite._id
      oldFavorite = local_collections.find(v => v._id === f_id)
    }
    if(c1.myEmoji) {
      const e_id = c1.myEmoji._id
      oldEmoji = local_collections.find(v => v._id === e_id)
    }
    if(c1.author.member_id) {
      const m_id = c1.author.member_id
      oldMember = local_members.find(v => v._id === m_id)
    }
    if(c1.author.user_id) {
      const u_id = c1.author.user_id
      oldUser = local_users.find(v => v._id === u_id)
    }
    const opt: MergeContentOpt = {
      oldContent,
      oldFavorite,
      oldEmoji,
      oldMember,
      oldUser,
    }
    await mergeContent(c1, opt)
  }

  
}

async function handleDraftParcels(
  list: LiuDownloadParcel_B[],
) {
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    if(v.status !== "has_data") return
    if(!v.draft) continue

    const oldDraft = await db.drafts.get(v.id)
    await mergeDraft(v.draft, oldDraft)
  }
  
}

async function mergeDraft(
  d: LiuDownloadDraft,
  oldDraft?: DraftLocalTable,
) {

}



type LocalTable = ContentLocalTable | CollectionLocalTable | UserLocalTable
  | MemberLocalTable

async function getLocalRows<T extends LocalTable>(
  ids: string[],
  table: LiuTable,
) {
  if(ids.length < 1) return []
  const col = db[table].where("_id").anyOf(ids)
  const contents = await col.toArray()
  return contents as T[]
}


interface MergeContentOpt {
  oldContent?: ContentLocalTable
  oldFavorite?: CollectionLocalTable
  oldEmoji?: CollectionLocalTable
  oldMember?: MemberLocalTable
  oldUser?: UserLocalTable
}

async function mergeContent(
  d: LiuDownloadContent,
  opt: MergeContentOpt,
) {

}



