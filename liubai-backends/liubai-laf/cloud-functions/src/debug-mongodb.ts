import cloud from "@lafjs/cloud"

const db = cloud.mongo.db
const gShared = cloud.shared

function isObjectId(id: string | ObjectId): boolean {
  return id instanceof ObjectId;
}

export async function main(ctx: FunctionContext) {
  return "nothing"
}