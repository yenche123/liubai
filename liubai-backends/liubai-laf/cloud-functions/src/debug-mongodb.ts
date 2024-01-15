import cloud from "@lafjs/cloud"
const db = cloud.mongo.db

export async function main(ctx: FunctionContext) {

  const res = await db.collection("Book").find().toArray()
  console.log(res)

  return true

}