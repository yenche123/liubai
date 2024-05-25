

// 版本号，凡是 dexieIdxs 被修改了，这里都要累加！！！
export const DB_VERSION = 59

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
    "first_id",
    "[infoType+user+spaceId]",
    "[infoType+user+threadEdited]",
    "[infoType+oState+user+spaceId]",
    "[infoType+oState+threadEdited]",
    "*tagIds",
  ],
  contents: [
    "_id",
    "first_id",
    "oState",
    "[oState+updatedStamp]",
    "[_id+infoType+oState]",
    "[parentThread+oState]",
    "[parentThread+oState+createdStamp]",
    "[replyToComment+oState+infoType]",
    "[replyToComment+oState+infoType+createdStamp]",
    "createdStamp",
    "updatedStamp",
    "pinStamp",
    "*tagIds",
    "*tagSearched",
    "stateId",
    "editedStamp",
    "removedStamp",
  ],
  collections: [
    "_id",
    "first_id",
    "content_id",
    "insertedStamp",
    "[user+infoType+forType+content_id]",
    "updatedStamp",
    "sortStamp",
  ],
  download_tasks: [
    "_id",
    "insertedStamp",
    "[target_id+target_table]"
  ],
  upload_tasks: [
    "_id",
    "insertedStamp",
    "[user+draft_id+progressType]",
    "[user+uploadTask+content_id+progressType]",
    "[user+uploadTask+workspace_id+progressType]",
    "[user+uploadTask+member_id+progressType]",
    "[user+uploadTask+collection_id+progressType]",
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


