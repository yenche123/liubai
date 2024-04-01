import type { Param_WebhookQiniu } from "@/common-types"
import qiniu from "qiniu"

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body as Param_WebhookQiniu

  if(!body) {
    return { code: "E4000", errMsg: "body is required in webhook-qiniu" }
  }

  console.log("接收到七牛云的回调............")
  console.log(body)

  return { code: "0000" }
}

