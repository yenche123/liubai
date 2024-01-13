import cloud from "@lafjs/cloud"
import type { Table_Token } from "@/common-types"
const db = cloud.mongo.db

export async function main(ctx: FunctionContext) {


  const cursor = db.collection<Table_Token>("Token").find()
  console.log("nihao")
  const list = await cursor.toArray()
  console.log("cooool")
  console.log(list)
  
  

  return true

}