import { db } from "~/utils/db"
import { ContentLocalTable } from "~/types/types-table"

async function addContent(data: ContentLocalTable) {
  const res = await db.contents.add(data)
  return res
}

async function updateContent(id: string, data: Partial<ContentLocalTable>) {
  const res = await db.contents.update(id, data)
  return res
}

async function getContentByFirstId(first_id: string) {
  const res = await db.contents.where({ first_id }).first()
  return res
}

async function getContent(
  id: string,
  alsoFindByFirstId = true,
) {
  let res = await db.contents.get(id)
  if(alsoFindByFirstId && !res) {
    res = await getContentByFirstId(id)
  }
  return res
}

export default {
  addContent,
  updateContent,
  getContent,
  getContentByFirstId,
}