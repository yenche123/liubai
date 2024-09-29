import cloud from "@lafjs/cloud"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("webhook-alipay triggered")

  return { code: "0000" }
}