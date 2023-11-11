// 用户登录、注册、进入
import cloud from '@lafjs/cloud'
import type { LiuRqReturn } from "@/common-types"

export async function main(ctx: FunctionContext) {
  console.log("welcome to user-login")

  // 0.1 检查 "登录功能" 是否关闭
  const env = process.env
  if(env.LIU_CLOUD_LOGIN === "02") {
    ctx.response?.send({ code: "B0002" })
    return false
  }

  const body = ctx.request?.body ?? {}
  const oT = body.operateType

  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "init") {
    res = handle_init()
  }
  else if(oT === "github_oauth") {

  }

  return res
}

function handle_init() {

  const keyPair = cloud.shared.get(`liu-rsa-key-pair`)
  const publicKey = keyPair?.publicKey
  if(!publicKey || typeof publicKey !== "string") {
    return { code: `E5001`, errMsg: `there is no liu-rsa-key-pair in cloud.shared` }
  }

  const _env = process.env
  const ghOAuthClientId = _env.LIU_GITHUB_OAUTH_CLIENT_ID

  const data: Record<string, string | undefined> = {
    publicKey,
    ghOAuthClientId,
  }

  return { code: `0000`, data }
}





