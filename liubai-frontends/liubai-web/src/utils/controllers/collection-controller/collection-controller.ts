import { db } from "../../db"
import { getLocalPreference } from "../../system/local-preference"


interface MyCollectionOpt {
  content_ids: string[]
}

// 根据 contents 的 id 来获取我的收藏或点赞
async function getMyCollectionByIds(opt: MyCollectionOpt) {

  const { local_id: user_id } = getLocalPreference()
  if(!user_id) return []

  let tmp = db.collections.where("content_id").anyOf(opt.content_ids)
  tmp = tmp.filter(v => {
    if(v.user === user_id) return true
    if(v.oState === "OK") return true
    return false
  })
  const res = await tmp.toArray()
  return res
}


export default {
  getMyCollectionByIds,
}