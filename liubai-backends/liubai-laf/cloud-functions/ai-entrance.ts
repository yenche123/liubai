// Function Name: ai-entrance

import type { Table_User, Wx_Gzh_Send_Msg } from "@/common-types"
import OpenAI from "openai"
import { checkAndGetWxGzhAccessToken } from "@/common-util"
import { sendWxMessage } from "@/service-send"
import { getNowStamp } from "@/common-time"

/********************* empty function ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with ai-entrance")
  return true
}

export interface AiEntrance {
  user: Table_User
  text?: string
  wx_gzh_openid?: string
}

export async function enter_ai(
  data: AiEntrance,
) {

  // 1. get text or other params
  const text = data.text
  if(!text) {
    console.warn("no text")
    return
  }
  
  // 2. construct args for zhipu
  const zhipu = new Zhipu()
  const param1: OpenAI.Chat.ChatCompletionCreateParams = {
    messages: [{ role: "user", content: text }],
    model: "glm-4-plus",
  }
  const res2 = await zhipu.chat(param1)
  if(!res2) return
  console.log("res2: ")
  console.log(res2)
  
  // 3. get text from ai
  const msg3 = res2.choices[0].message.content
  if(!msg3) {
    console.warn("no msg3")
    return
  }

  // 4. send to wx user
  const wx_gzh_openid = data.wx_gzh_openid
  if(!wx_gzh_openid) {
    console.warn("no wx_gzh_openid")
    return
  }
  const obj4: Wx_Gzh_Send_Msg = {
    msgtype: "text",
    text: { content: msg3 },
    customservice: {
      kf_account: "glm-4-plus@test",
    }
  }
  const res4 = await sendToWxGzh(wx_gzh_openid, obj4)
}


async function sendToWxGzh(
  wx_gzh_openid: string,
  obj: Wx_Gzh_Send_Msg,
) {
  const accessToken = await checkAndGetWxGzhAccessToken()
  if(!accessToken) return
  const res = await sendWxMessage(wx_gzh_openid, accessToken, obj)
  return res
}


class Zhipu {

  private _client: OpenAI | undefined

  constructor() {
    const _this = this
    const _env = process.env
    const apiKey = _env.LIU_ZHIPU_API_KEY
    const baseURL = _env.LIU_ZHIPU_BASE_URL
    try {
      _this._client = new OpenAI({ apiKey, baseURL })
    } catch(err) {
      console.warn("Zhipu constructor gets client error: ")
      console.log(err)
    }
  }

  async chat(
    params: OpenAI.Chat.ChatCompletionCreateParams,
  ) {
    const client = this._client
    if(!client) return

    try {
      const t1 = getNowStamp()
      const chatCompletion = await client.chat.completions.create(params)
      const t2 = getNowStamp()
      const cost = t2 - t1
      console.log(`zhipu chat cost: ${cost}ms`)
      return chatCompletion as OpenAI.Chat.ChatCompletion
    }
    catch(err) {
      console.warn("zhipu chat error: ")
      console.log(err)
    }
  }

}



