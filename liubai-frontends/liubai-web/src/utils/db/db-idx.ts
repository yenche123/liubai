

// 版本号，凡是 dexieIdxs 被修改了，这里都要累加！！！
export const DB_VERSION = 45

const dexieIdxs = {
  users: [
    "_id",
  ],
  workspaces: [
    "_id",
    "[infoType+owner]",
  ],
  members: [
    "_id",
    "[user+spaceId]",
  ],
  drafts: [
    "_id",
    "cloud_id",
    "[infoType+oState+user+spaceId]",
    "[infoType+oState+threadEdited]",
    "*tagIds",
  ],
  contents: [
    "_id",
    "cloud_id",
    "oState",
    "[oState+updatedStamp]",
    "[_id+infoType+oState]",
    "[parentThread+oState]",
    "[parentThread+oState+createdStamp]",
    "[replyToComment+oState]",
    "[replyToComment+oState+createdStamp]",
    "createdStamp",
    "updatedStamp",
    "pinStamp",
    "*tagIds",
    "*tagSearched",
    "stateId",
    "editedStamp",
  ],
  collections: [
    "_id",
    "cloud_id",
    "content_id",
    "insertedStamp",
    "[user+infoType+forType+content_id]",
    "updatedStamp",
  ],
  download_task: [
    "_id",
    "[target_id+target_table]"
  ]
}

type TableNames = keyof typeof dexieIdxs

function getIndexObject() {
  const obj: Record<string, string> = {}
  const keys = Object.keys(dexieIdxs)
  for(let i=0; i<keys.length; i++) {
    const key = keys[i] as TableNames
    const list = dexieIdxs[key]
    const str = list.join(", ")
    obj[key] = str
  }
  return obj
}

export const dbSchema = getIndexObject()


