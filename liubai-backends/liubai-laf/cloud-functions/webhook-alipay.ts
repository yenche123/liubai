import cloud from "@lafjs/cloud"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("webhook-alipay triggered")
  const { body, headers } = ctx
  console.log("body..........")
  console.log(body)
  console.log("headers..........")
  console.log(headers)

  return { code: "0000" }
}