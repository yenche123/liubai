// Function Name: ai-shared

import cloud from "@lafjs/cloud"
import { 
  type LiuAi, 
  type AiBot,
  type AiEntry,
  type AiCharacter,
  type Wx_Gzh_Send_Msg,
  type Wx_Gzh_Send_Msgmenu,
  type Wx_Gzh_Send_Msgmenu_Item,
  type Ns_Zhipu,
  type Ns_SiliconFlow,
  type AiImageSizeType,
  type Ns_Stepfun,
  type Table_User,
  type Partial_Id,
  type Table_LogAi,
  type OaiChatCompletion,
  type OaiCreateParam,
  type AiFinishReason,
  type OaiPrompt,
  type DsReasonerMessage,
  type Table_AiChat,
  type Table_Content,
  type AiToolGetScheduleSpecificDate,
  Sch_AiToolGetScheduleParam,
  Sch_AiToolGetCardsParam,
  type AiToolGetScheduleParam,
  type SortWay,
  type AiToolGetCardType,
  type T_I18N,
  type OaiToolPrompt,
  type OaiToolCall,
  type AiToolAddCalendarParam,
  type DataPass,
  type OaiStreamCompletion,
  type OaiStreamChoiceDelta,
  type OaiChatCompletionChunk,
  type LiuRqReturn,
  Ns_MapTool,
} from "@/common-types"
import { LiuReporter, WxGzhSender } from "@/service-send"
import { 
  checkAndGetWxGzhAccessToken,
  checker,
  decryptEncData,
  getDocAddId,
  getLiuDoman,
  LiuDateUtil,
  liuFetch,
  liuReq,
  MarkdownParser,
  RichTexter,
  valTool,
  ValueTransform,
} from "@/common-util"
import { aiBots, aiI18nShared } from "@/ai-prompt"
import { useI18n, aiLang, getCurrentLocale, commonLang, getAppName } from "@/common-i18n"
import { WxGzhUploader } from "@/file-utils"
import { 
  getBasicStampWhileAdding, 
  getNowStamp,
  localizeStamp,
  HOUR,
  DAY,
} from "@/common-time"
import OpenAI from "openai"
import * as vbot from "valibot"
import { addDays, set as date_fn_set } from "date-fns"

const db = cloud.database()
const _ = db.command


type BaseChatResolver = (res: OaiChatCompletion | undefined) => void

export class BaseLLM {
  protected _client: OpenAI | undefined
  protected _baseUrl: string | undefined
  private _isStepfun = false

  constructor(
    apiKey?: string, 
    baseURL?: string,
    defaultHeaders?: Record<string, string>,
  ) {
    this._baseUrl = baseURL
    try {
      this._client = new OpenAI({ apiKey, baseURL, defaultHeaders })
    }
    catch(err) {
      console.warn("BaseLLM constructor gets client error: ")
      console.log(err)
    }

    if(baseURL && baseURL.includes("api.stepfun.com")) {
      this._isStepfun = true
    }
  }

  private _tryTimes = 0

  public chat(
    params: OaiCreateParam,
    opt?: LiuAi.BaseLLMChatOpt,
  ): Promise<OaiChatCompletion | undefined> {
    const _this = this
    const timeoutSec = opt?.timeoutSec ?? 59
    let hasReturn = false

    const _wait = async (a: BaseChatResolver) => {
      // 1. set timeout
      let timeout = setTimeout(() => {
        if(hasReturn) return
        console.log("custom timeout occurs!")
        hasReturn = true
        a(undefined)
      }, timeoutSec * 1000)

      // 2. to chat
      let res: OaiChatCompletion | undefined
      if(params.stream) {
        res = await _this._streamChat(params, opt)
      }
      else {
        res = await _this._chat(params, opt)
      }

      // 3. decide to continue
      if(hasReturn) return
      hasReturn = true
      clearTimeout(timeout)

      a(res)
    }

    return new Promise(_wait)
  }


  private async _streamChat(
    params: OaiCreateParam,
    opt?: LiuAi.BaseLLMChatOpt,
  ) {
    const _this = this
    const client = _this._client
    if(!client) return

    _this._tryTimes++
    const copiedParams = valTool.copyObject(params)
    copiedParams.stream_options = { include_usage: true }

    let usage: LiuAi.Usage | undefined
    let id = ""
    let created = 0
    let model = ""
    let reasoningContent = ""
    let answerContent = ""
    let finishReason: AiFinishReason | undefined
    let system_fingerprint = ""

    const _handleOtherData = (chunk: OaiChatCompletionChunk) => {
      const tmpChoice = chunk.choices?.[0] as any
      if(chunk.usage) usage = chunk.usage
      else if(tmpChoice?.usage) usage = tmpChoice.usage

      if(chunk.id) id = chunk.id
      if(chunk.model) model = chunk.model
      if(chunk.created) created = chunk.created
      if(chunk.system_fingerprint) {
        system_fingerprint = chunk.system_fingerprint
      }
    }

    const t1 = getNowStamp()
    try {
      const chatCompletion = await client.chat.completions.create(copiedParams)
      const completion = chatCompletion as OaiStreamCompletion
      for await (const chunk of completion) {
        const aChoice = chunk.choices[0]

        // if no choice
        if(!aChoice) {
          _handleOtherData(chunk)
          continue
        }

        // handle delta
        const delta = aChoice.delta as OaiStreamChoiceDelta
        // console.log("delta: ", delta)
        if(delta.reasoning_content) {
          // console.log("delta.reasoning_content: ", delta.reasoning_content)
          reasoningContent += delta.reasoning_content
        }
        else if(delta.content) {
          // console.log("delta.content: ", delta.content)
          answerContent += delta.content
        }
        else if(_this._isStepfun && delta.reasoning) {
          reasoningContent += delta.reasoning
        }

        // handle finish_reason
        const reason = aChoice.finish_reason
        if(reason) {
          finishReason = AiShared.getAiFinishReason(reason)
          _handleOtherData(chunk)
        }
      }

    }
    catch(err) {
      console.warn("BaseLLM streamChat error: ", err)
      return
    }
    const t2 = getNowStamp()

    if(!usage) {
      console.warn("no usage in streamChat")
      return
    }
    if(!created) {
      console.warn("no created in streamChat")
      return
    }
    if(!id) {
      console.warn("no id in streamChat")
      return
    }
    if(!model) {
      console.warn("no model in streamChat")
      return
    }
    if(!finishReason) {
      console.warn("no finishReason in streamChat")
      return
    }

    const message = {
      content: answerContent,
      role: "assistant"
    } as DsReasonerMessage
    if(reasoningContent) {
      message.reasoning_content = reasoningContent
    }

    const result = {
      id,
      choices: [
        {
          finish_reason: finishReason,
          index: 0,
          message,
          logprobs: null,
        }
      ],
      created,
      model,
      system_fingerprint,
      object: "chat.completion",
      usage,
    } as OaiChatCompletion
    _this._tryTimes = 0
    _this._log(result, t2 - t1, opt)
    return result
  }

  private _processChatCompletion(
    chatCompletion: any,
  ) {
    if(!chatCompletion) return
    if(!this._isStepfun) return

    // 1. turn reasoning into reasoning_content for step-r1-v-mini
    const theChoice = chatCompletion?.choices?.[0]
    if(!theChoice) return
    const message = theChoice?.message as any
    if(!message) return
    if(typeof message.reasoning === "string" && !message.reasoning_content) {
      message.reasoning_content = message.reasoning
      delete message.reasoning
    }
  }

  private async _chat(
    params: OaiCreateParam,
    opt?: LiuAi.BaseLLMChatOpt,
  ): Promise<OaiChatCompletion | undefined> {
    const _this = this
    const client = _this._client
    if(!client) return

    _this._tryTimes++
    const copiedParams = valTool.copyObject(params)

    try {
      const t1 = getNowStamp()
      const chatCompletion = await client.chat.completions.create(copiedParams)
      const t2 = getNowStamp()

      _this._processChatCompletion(chatCompletion)

      _this._tryTimes = 0
      _this._log(chatCompletion as any, t2 - t1, opt)
      return chatCompletion as OaiChatCompletion
    }
    catch(err) {
      console.warn("BaseLLM chat error: ")
      console.log(err)

      let isRateLimit = false
      const errType = typeof err
      const errMsg = errType === "string" ? err : err?.toString?.()

      if(typeof errMsg === "string") {
        // for baichuan
        if(!isRateLimit) {
          isRateLimit = errMsg.includes("Rate limit reached for requests")
        }

        // for zhipu
        if(!isRateLimit) {
          isRateLimit = errMsg.includes("当前API请求过多，请稍后重试")
        }
        
        // for moonshot
        if(!isRateLimit) {
          isRateLimit = errMsg.includes("please try again after 1 seconds")
        }

        // fallback
        if(!isRateLimit) {
          isRateLimit = errMsg.includes("RateLimitError: 429")
        }

        if(errMsg.includes("undefined message role")) {
          LogHelper.printLastItems(params.messages)
        }
        
      }

      const maxTryTimes = opt?.maxTryTimes ?? 2
      if(_this._tryTimes < maxTryTimes && isRateLimit) {
        console.log("getting to try again!")
        await valTool.waitMilli(1000)
        const triedRes = await _this.chat(copiedParams, opt)
        return triedRes
      }
    }
  }

  private _log(
    chatCompletion: Partial<OaiChatCompletion>,
    costDuration: number,
    opt?: LiuAi.BaseLLMChatOpt,
  ) {
    const usage = chatCompletion?.usage
    if(!usage) return

    const logCol = db.collection("LogAi")
    const b1 = getBasicStampWhileAdding()
    const aLog: Partial_Id<Table_LogAi> = {
      ...b1,
      infoType: "cost",
      costUsage: usage,
      costBaseUrl: this._baseUrl,
      userId: opt?.user?._id,
      choices: chatCompletion.choices,
      model: chatCompletion.model,
      requestId: chatCompletion.id,
      systemFingerprint: chatCompletion.system_fingerprint,
      costDuration,
    }
    logCol.add(aLog)
  }


}


interface ThinkTagContent {
  content: string;
  startIndex: number;
  endIndex: number;
}

export class AiShared {

  static getEndpointFromProvider(
    p: LiuAi.ComputingProvider,
  ): LiuAi.ApiEndpoint | undefined {
    let apiKey: string | undefined
    let baseURL: string | undefined
    const _env = process.env

    // If secondaryProvider exists, use it first
    if(p === "siliconflow") {
      apiKey = _env.LIU_SILICONFLOW_API_KEY
      baseURL = _env.LIU_SILICONFLOW_BASE_URL
    }
    else if(p === "gitee-ai") {
      apiKey = _env.LIU_GITEE_AI_API_KEY
      baseURL = _env.LIU_GITEE_AI_BASE_URL
    }
    else if(p === "qiniu") {
      apiKey = _env.LIU_QINIU_LLM_API_KEY
      baseURL = _env.LIU_QINIU_LLM_BASE_URL
    }
    else if(p === "tencent-lkeap") {
      apiKey = _env.LIU_TENCENT_LKEAP_API_KEY
      baseURL = _env.LIU_TENCENT_LKEAP_BASE_URL
    }
    else if(p === "suanleme") {
      apiKey = _env.LIU_SUANLEME_API_KEY
      baseURL = _env.LIU_SUANLEME_BASE_URL
    }
    else if(p === "aliyun-bailian") {
      apiKey = _env.LIU_ALIYUN_BAILIAN_API_KEY
      baseURL = _env.LIU_ALIYUN_BAILIAN_BASE_URL
    }
    else if(p === "baichuan") {
      apiKey = _env.LIU_BAICHUAN_API_KEY
      baseURL = _env.LIU_BAICHUAN_BASE_URL
    }
    else if(p === "deepseek") {
      apiKey = _env.LIU_DEEPSEEK_API_KEY
      baseURL = _env.LIU_DEEPSEEK_BASE_URL
    }
    else if(p === "tencent-hunyuan") {
      apiKey = _env.LIU_TENCENT_HUNYUAN_API_KEY
      baseURL = _env.LIU_TENCENT_HUNYUAN_BASE_URL
    }
    else if(p === "minimax") {
      apiKey = _env.LIU_MINIMAX_API_KEY
      baseURL = _env.LIU_MINIMAX_BASE_URL
    }
    else if(p === "moonshot") {
      apiKey = _env.LIU_MOONSHOT_API_KEY
      baseURL = _env.LIU_MOONSHOT_BASE_URL
    }
    else if(p === "stepfun") {
      apiKey = _env.LIU_STEPFUN_API_KEY
      baseURL = _env.LIU_STEPFUN_BASE_URL
    }
    else if(p === "zero-one") {
      apiKey = _env.LIU_YI_API_KEY
      baseURL = _env.LIU_YI_BASE_URL
    }
    else if(p === "zhipu") {
      apiKey = _env.LIU_ZHIPU_API_KEY
      baseURL = _env.LIU_ZHIPU_BASE_URL
    }

    if(apiKey && baseURL) {
      return { apiKey, baseURL }
    }

  }


  static getApiEndpointFromBot(
    bot: AiBot
  ): LiuAi.ApiEndpoint | undefined {
    const p = bot.provider
    const p2 = bot.secondaryProvider
    let defaultHeaders = bot.metaData?.defaultHeaders

    let apiEndpoint: LiuAi.ApiEndpoint | undefined
    if(p2) {
      apiEndpoint = AiShared.getEndpointFromProvider(p2)
    }
    if(!apiEndpoint) {
      apiEndpoint = AiShared.getEndpointFromProvider(p)
    }

    if(apiEndpoint) {
      apiEndpoint.defaultHeaders = defaultHeaders
    }

    return apiEndpoint
  }

  static getCharacterName(character?: AiCharacter) {
    if(!character) return
    let name = ""
    const bot = aiBots.find(v => v.character === character)
    if(bot) name = bot.name
    return name
  }

  static getGzhType() {
    const _env = process.env
    return _env.LIU_WX_GZ_TYPE ?? "subscription_account"
  }

  static getAiFinishReason(
    reason: string
  ): AiFinishReason | undefined {
    if(reason === "stop" || reason === "length") return reason
    if(reason === "tool_calls") return reason
  }

  static getFinishReason(
    chatCompletion: OaiChatCompletion
  ): AiFinishReason | undefined {
    const reason = chatCompletion.choices?.[0]?.finish_reason
    return this.getAiFinishReason(reason)
  }

  static setFinishReasonToLength(
    chatCompletion: OaiChatCompletion,
  ) {
    const theChoice = chatCompletion?.choices?.[0]
    if(!theChoice) return
    if(theChoice.finish_reason === "stop") {
      theChoice.finish_reason = "length"
    }
  }

  private static extractThinkContent(text: string): ThinkTagContent[] {
    const regex = /<think>([\s\S]*?)<\/think>/g;
    const results: ThinkTagContent[] = []
    
    let match: RegExpExecArray | null
    let tryTimes = 0
    while ((match = regex.exec(text)) !== null && tryTimes < 10) {
      results.push({
        content: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
      tryTimes++
    }
    
    return results
  }

  private static handleContentForReasoning(
    res: OaiChatCompletion,
    content: string,
    reasoning_content: string,
    bot?: AiBot,
  ) {

    // 1. extract <think>......</think>
    const thinkContents = AiShared.extractThinkContent(content)
    if(thinkContents.length > 0) {
      const thinkContent = thinkContents[0]
      content = content.substring(thinkContent.endIndex)
      reasoning_content = thinkContent.content
      return { content, reasoning_content }
    }
    
    // 2. starts with <think>
    if(content.startsWith("<think>")) {
      reasoning_content = content.substring(7)
      content = ""
      AiShared.setFinishReasonToLength(res)
      return { content, reasoning_content }
    }
    
    // 3. starts with "好的，" /  "嗯，" / "好，"
    const thinkingInContent = bot?.metaData?.thinkingInContent
    const finishReason = AiShared.getFinishReason(res)
    const mightHaveReasoningContent = Boolean(finishReason === "length" && !thinkingInContent)
    if(mightHaveReasoningContent) {
      const alrightList = ["Alright, ", "好的，", "嗯，", "好，", "好吧，", "用户问"]
      const res3 = alrightList.some(x => content.startsWith(x))
      if(res3) {
        reasoning_content = content
        content = ""
      }
    }

    return { content, reasoning_content }
  }

  static getContentFromLLM(
    res: OaiChatCompletion,
    bot?: AiBot,
    isReasoning?: boolean,
  ) {
    // 1. check out params
    const choices = res?.choices
    if(!choices || choices.length < 1) {
      console.warn("no choices in getContentFromLLM")
      console.log(res)
      return {}
    }

    const theChoice = choices[0]
    if(!theChoice) {
      console.warn("no choice in getContentFromLLM")
      console.log(choices)
      return {}
    }
    const message = theChoice.message as DsReasonerMessage
    if(!message) {
      console.warn("no message in getContentFromLLM")
      console.log(choices)
      return {}
    }

    // 2. get original content & reasoning_content
    let content = message.content ?? ""
    let reasoning_content = message.reasoning_content ?? ""
    if(!content) {
      if(!reasoning_content) {
        console.warn("no content and reasoning_content in getContentFromLLM")
        return {}
      }
      AiShared.setFinishReasonToLength(res)
    }

    // 3. remove "?" in the beginning for zhipu
    if(bot?.character === "zhipu") {
      let err1 = content.startsWith("？")
      if(err1) content = content.substring(1)
    }
    
    // 4. handle isReasoning
    if(typeof isReasoning === "undefined") {
      if(bot) {
        isReasoning = Boolean(AiShared.isReasoningBot(bot))
      }
      else {
        const str4 = content.trim()
        isReasoning = str4.startsWith("<think>")
      }
    }

    // 5. extract reasoning content from content
    if(!reasoning_content && isReasoning) {
      const res5 = AiShared.handleContentForReasoning(
        res,
        content,
        reasoning_content,
        bot,
      )
      content = res5.content
      reasoning_content = res5.reasoning_content
    }

    // 6. finally trim
    content = content.trim()
    reasoning_content = reasoning_content.trim()

    // console.warn("let me see content and reasoning_content: ")
    // console.log("reasoning_content: ", reasoning_content)
    // console.log("content: ", content)

    return { content, reasoning_content }
  }

  static isReasoningBot(bot: AiBot) {
    return bot.abilities.includes("reasoning")
  }

  static calculateTextToken(text: string) {
    let token = 0
    for(let i=0; i<text.length; i++) {
      const char = text[i]
      if(valTool.isLatinChar(char)) {
        token += 0.4
      }
      else {
        token += 1
      }
    }
    token = Math.ceil(token)
    return token
  }

  static calculateChatToken(
    chat: Table_AiChat,
  ) {
    const { 
      infoType, 
      usage, 
      text, 
      imageUrl,
    } = chat
    if(infoType === "assistant" || infoType === "summary") {
      const token1 = usage?.completion_tokens
      if(token1) return token1
    }

    let token = 0
    if(text) {
      token = AiShared.calculateTextToken(text)
    }
    else if(imageUrl) {
      token += 600
    }
    
    if(infoType === "tool_use") {
      const toolToken1 = usage?.completion_tokens ?? 0
      let toolToken2 = 0
      if(chat.funcName) {
        toolToken2 += AiShared.calculateTextToken(chat.funcName)
      }
      if(chat.funcJson) {
        const jsonStr = valTool.objToStr(chat.funcJson)
        toolToken2 += AiShared.calculateTextToken(jsonStr)
      }
      toolToken2 += 10
      token += Math.max(toolToken1, toolToken2)
    }

    return token
  }

  static calculatePromptToken(
    prompt: OaiPrompt,
  ) {
    const content = prompt.content
    if(!content) return 0
    if(typeof content === "string") {
      return AiShared.calculateTextToken(content)
    }

    let token = 0
    for(let i=0; i<content.length; i++) {
      const v = content[i]
      if(v.type === "text") {
        token += AiShared.calculateTextToken(v.text)
      }
      else if(v.type === "image_url") {
        token += 600
      }
      else if(v.type === "input_audio") {
        token += 1000
      }
    }

    return token
  }

  static calculatePromptsToken(
    prompts: OaiPrompt[],
  ) {
    let token = 0
    for(let i=0; i< prompts.length; i++) {
      const v = prompts[i]
      token += AiShared.calculatePromptToken(v)
    }
    return token
  }

  static async addChat(data: Partial_Id<Table_AiChat>) {
    const col = db.collection("AiChat")
    const res1 = await col.add(data)
    const chatId = getDocAddId(res1)
    if(!chatId) {
      console.warn("cannot get chatId while adding chat error")
      console.log(res1)
      console.log("data: ")
      console.log(data)
      return
    }
    return chatId
  }
  
  static async updateAiChat(id: string, data: Partial<Table_AiChat>) {
    if(!data.updatedStamp) data.updatedStamp = getNowStamp()
    const cCol = db.collection("AiChat")
    const res = await cCol.doc(id).update(data)
    return res
  }

  static getToolMessage(
    tool_call_id: string,
    t: T_I18N,
    v: Table_AiChat,
  ) {
    const { funcName, contentId } = v

    let toolMsg: OaiToolPrompt | undefined
    const successMsg = `{'code':'0000','data':{'id':'__id__'}}`
    if (funcName === "add_note") {
      if (contentId) {
        const msg = successMsg.replace("__id__", contentId)
        toolMsg = { role: "tool", content: msg, tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("not_agree_yet"), tool_call_id }
      }
    }
    else if (funcName === "add_todo") {
      if (contentId) {
        const msg = successMsg.replace("__id__", contentId)
        toolMsg = { role: "tool", content: msg, tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("not_agree_yet"), tool_call_id }
      }
    }
    else if (funcName === "add_calendar") {
      if (contentId) {
        const msg = successMsg.replace("__id__", contentId)
        toolMsg = { role: "tool", content: msg, tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("not_agree_yet"), tool_call_id }
      }
    }
    else if(funcName === "web_search") {
      if(v.text && v.webSearchData && v.webSearchProvider) {
        toolMsg = { role: "tool", content: v.text, tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("fail_to_search"), tool_call_id }
      }
    }
    else if(funcName === "parse_link") {
      if(v.text) {
        toolMsg = { role: "tool", content: v.text, tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("fail_to_parse_link"), tool_call_id }
      }
    }
    else if(funcName === "draw_picture") {
      if(v.text && v.drawPictureUrl) {
        toolMsg = { 
          role: "tool", 
          content: `[Finish to draw]`, 
          tool_call_id,
        }
      }
      else {
        toolMsg = {
          role: "tool",
          content: "[Fail to draw]",
          tool_call_id,
        }
      }
    }
    else if(funcName === "get_cards") {
      if(v.text) {
        toolMsg = {
          role: "tool",
          content: v.text,
          tool_call_id,
        }
      }
    }
    else if(funcName === "get_schedule") {
      if(v.text) {
        toolMsg = {
          role: "tool",
          content: v.text,
          tool_call_id,
        }
      }
    }
    else if(funcName?.startsWith("maps_") && v.mapSearchData) {
      toolMsg = {
        role: "tool",
        content: valTool.objToStr(v.mapSearchData),
        tool_call_id,
      }
    }

    return toolMsg
  }

  static getAssistantMsgWithTool(
    tool_calls: OaiToolCall[],
    v: Table_AiChat,
  ) {
    const { character, funcName, text } = v
    const assistantName = AiShared.getCharacterName(character)
    let msg: OaiPrompt = {
      role: "assistant",
      tool_calls,
      name: assistantName,
    }

    if(funcName === "draw_picture" && text) {
      const aToolCall = tool_calls[0]
      if(!aToolCall) return msg
      const theFunc = aToolCall["function"]
      if(!theFunc) return msg
      const drawArgsStr = theFunc["arguments"]
      if(!drawArgsStr) return msg
      const drawArgs = valTool.strToObj(drawArgsStr)
      drawArgs.prompt = text
      const drawArgsStr2 = valTool.objToStr(drawArgs)
      theFunc["arguments"] = drawArgsStr2
    }

    return msg
  }

  static turnBaseUrlToProvider(
    url?: string,
  ): LiuAi.ComputingProvider | undefined {
    if(!url) return

    if(url.includes("dashscope.aliyuncs.com")) return "aliyun-bailian"
    if(url.includes("api.baichuan-ai.com")) return "baichuan"
    if(url.includes("api.deepseek.com")) return "deepseek"
    if(url.includes("api.hunyuan.cloud.tencent.com")) return "tencent-hunyuan"
    if(url.includes("api.minimax.chat")) return "minimax"
    if(url.includes("api.moonshot.cn")) return "moonshot"
    if(url.includes("api.stepfun.com")) return "stepfun"
    if(url.includes("api.lingyiwanwu.com")) return "zero-one"
    if(url.includes("open.bigmodel.cn")) return "zhipu"
    if(url.includes("api.siliconflow.cn")) return "siliconflow"
    if(url.includes("ai.gitee.com")) return "gitee-ai"
    if(url.includes("api.qnaigc.com")) return "qiniu"
    if(url.includes("api.lkeap.cloud.tencent.com")) return "tencent-lkeap"
    if(url.includes("api.suanli.cn")) return "suanleme"
    
  }

  static storageAiModel(
    model?: string,
  ) {
    if(!model) return

    if(model === "deepseek-chat") return "deepseek-v3"
    if(model === "deepseek-reasoner") return "deepseek-r1"

    return model
  }

}

export class TellUser {

  static async text(
    entry: AiEntry, 
    text: string,
    opt?: LiuAi.TellUserOpt,
  ) {
    const { wx_gzh_openid } = entry

    // 1. send to wx gzh
    if(wx_gzh_openid) {
      // console.warn("markdown: ")
      // console.log(text)
      text = MarkdownParser.mdToWxGzhText(text)
      // console.warn("wx gzh text: ")
      // console.log(text)

      const obj1: Wx_Gzh_Send_Msg = {
        msgtype: "text",
        text: { content: text },
      }
      this._fillWxGzhKf(obj1, opt)
      const res1 = await this._sendToWxGzh(wx_gzh_openid, obj1)
      return res1
    }

  }

  static async image(
    entry: AiEntry,
    imageUrl: string,
    opt?: LiuAi.TellUserOpt,
  ) {
    const { wx_gzh_openid } = entry

    // 1. send to wx gzh
    if(wx_gzh_openid) {
      const res1 = await WxGzhUploader.mediaByUrl(imageUrl)
      const media_id = res1?.media_id
      if(!media_id) return

      const obj2: Wx_Gzh_Send_Msg = {
        msgtype: "image",
        image: { media_id },
      }
      this._fillWxGzhKf(obj2, opt)
      const res2 = await this._sendToWxGzh(wx_gzh_openid, obj2)
      return res2
    }
  }


  static async menu(
    entry: AiEntry,
    prefixMessage: string,
    menuList: LiuAi.MenuItem[],
    suffixMessage: string,
    fromCharacter?: AiCharacter
  ) {
    const _env = process.env
    const gzhType = AiShared.getGzhType()
    const { wx_gzh_openid, user } = entry
    const { t } = useI18n(aiLang, { user })

    // 1. localize the menuList
    const wx_menu_list: Wx_Gzh_Send_Msgmenu_Item[] = []
    for(let i=0; i<menuList.length; i++) {
      const v = menuList[i]
      const { operation, character } = v

      if(operation === "clear_history") {
        wx_menu_list.push({ id: "clear_history", content: t("clear_context") })
        continue
      }

      if(operation === "kick" && character) {
        const characterName = AiShared.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({ id: "kick_" + character, content: t("kick") + characterName })
      }

      if(operation === "add" && character) {
        const characterName = AiShared.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({ id: "add_" + character, content: t("add") + characterName })
      }

      if(operation === "continue" && character) {
        const characterName = AiShared.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({
          id: "continue_" + character,
          content: t("continue_bot", { botName: characterName })
        })

        // turn markdown to plain-text for wx gzh
        if(wx_gzh_openid) {
          prefixMessage = MarkdownParser.mdToWxGzhText(prefixMessage)
        }
      }

    }

    // 2. send to wx gzh
    if(wx_gzh_openid) {
      if(gzhType === "subscription_account") {
        console.warn("we cannot send the menu to the user due to subscription_account")
        console.log("prefixMessage: ", prefixMessage)
        console.log("menuList: ", menuList)
        console.log("suffixMessage: ", suffixMessage)
        return
      }

      const obj2: Wx_Gzh_Send_Msgmenu = {
        msgtype: "msgmenu",
        msgmenu: {
          head_content: prefixMessage,
          list: wx_menu_list,
          tail_content: suffixMessage,
        }
      }
      this._fillWxGzhKf(obj2, { fromCharacter })
      const res2 = await this._sendToWxGzh(wx_gzh_openid, obj2)
      return res2
    }
    

  }

  static async typing(entry: AiEntry) {
    const { wx_gzh_openid } = entry

    // 1. to wx gzh
    if(wx_gzh_openid) {
      const wxGzhAccessToken = await checkAndGetWxGzhAccessToken()
      if(!wxGzhAccessToken) return
      WxGzhSender.sendTyping(wx_gzh_openid, wxGzhAccessToken)
    }
  }

  private static _fillWxGzhKf(
    obj: Wx_Gzh_Send_Msg,
    opt?: LiuAi.TellUserOpt,
  ) {
    const kf_account = this._getWxGzhKfAccount(opt)
    if(kf_account) {
      obj.customservice = { kf_account }
    }
  }

  private static _getWxGzhKfAccount(
    opt?: LiuAi.TellUserOpt,
  ) {
    let c = opt?.fromBot?.character ?? opt?.fromCharacter

    const _env = process.env
    if(opt?.fromSystem2) {
      return _env.LIU_WXGZH_KF_SYSTEM2
    }
    if(c === "baixiaoying") {
      return _env.LIU_WXGZH_KF_BAIXIAOYING
    }
    if(c === "deepseek") {
      return _env.LIU_WXGZH_KF_DEEPSEEK
    }
    if(c === "ds-reasoner") {
      return _env.LIU_WXGZH_KF_DS_REASONER
    }
    if(c === "hailuo") {
      return _env.LIU_WXGZH_KF_HAILUO
    }
    if(c === "hunyuan") {
      return _env.LIU_WXGZH_KF_HUNYUAN
    }
    if(c === "kimi") {
      return _env.LIU_WXGZH_KF_KIMI
    }
    if(c === "tongyi-qwen") {
      return _env.LIU_WXGZH_KF_TONGYI_QWEN
    }
    if(c === "wanzhi") {
      return _env.LIU_WXGZH_KF_WANZHI
    }
    if(c === "yuewen") {
      return _env.LIU_WXGZH_KF_YUEWEN
    }
    if(c === "zhipu") {
      return _env.LIU_WXGZH_KF_ZHIPU
    }
  }

  private static async _sendToWxGzh(
    wx_gzh_openid: string,
    obj: Wx_Gzh_Send_Msg,
  ) {
    const accessToken = await checkAndGetWxGzhAccessToken()
    if(!accessToken) return
    const res = await WxGzhSender.sendMessage(wx_gzh_openid, accessToken, obj)
    return res
  }

}

/******************** tool for web search ************************/
export class WebSearch {

  static async run(q: string) {
    const _env = process.env
    const zhipuUrl = _env.LIU_ZHIPU_BASE_URL
    const zhipuApiKey = _env.LIU_ZHIPU_API_KEY

    let searchRes: LiuAi.SearchResult | undefined
    if(zhipuUrl && zhipuApiKey) {
      searchRes = await this.runByZhipu(q, zhipuUrl, zhipuApiKey)
    }

    return searchRes
  }

  // reference: https://www.bigmodel.cn/dev/api/search-tool/web-search-pro
  static async runByZhipu(
    q: string,
    baseUrl: string,
    apiKey: string,
  ) {
    const url = baseUrl + "tools"
    const headers = { "Authorization": `Bearer ${apiKey}` }
    const messages = [{ role: "user", content: q }]
    const body = {
      tool: "web-search-pro",
      messages,
      stream: false,
    }
    try {
      const res = await liuReq<Ns_Zhipu.WebSearchChatCompletion>(
        url, 
        body, 
        { headers }
      )
      if(res.code === "0000" && res.data) {
        const parseResult = this._parseFromZhipu(q, res.data)
        return parseResult
      }
      console.warn("web-search runByZhipu got an unexpected result: ")
      console.log(res)
    }
    catch(err) {
      console.warn("web-search runByZhipu error: ")
      console.log(err)
    }
  }

  // parse from zhipu's result
  private static _parseFromZhipu(
    q: string,
    chatCompletion: Ns_Zhipu.WebSearchChatCompletion,
  ): LiuAi.SearchResult | undefined {
    // 1. get results
    const theChoice = chatCompletion.choices[0]
    if(!theChoice) return
    const { finish_reason, message } = theChoice
    if(finish_reason !== "stop") {
      console.warn(`web-search finish reason is not stop: ${finish_reason}`)
      console.log(theChoice)
      return
    }
    const tool_calls = message?.tool_calls ?? []
    if(!tool_calls.length) return
    const resultData = tool_calls.find(v => v.type === "search_result")
    const results = resultData?.search_result ?? []
    if(results.length < 1) {
      return {
        markdown: `搜索：${q}\n结果：查无任何结果`,
        provider: "zhipu",
        originalResult: chatCompletion,
      }
    }

    // 2. get intent
    const intentData = tool_calls.find(v => v.type === "search_intent")
    const intents = intentData?.search_intent ?? []
    const theIntent = intents.length > 0 ? intents[0] : undefined

    let md = ""
    // 3. add intent
    if(theIntent) {
      md += `【关键词】：${theIntent.keywords}\n`
      md += `【原始意图】：${theIntent.query}\n`
      if(theIntent.intent === "SEARCH_ALL") {
        md += `【搜索范围】：全网搜索\n`
      }
    }
    else {
      md += `【搜索】：${q}\n`
    }
    md += `【搜索结果】：\n\n`

    // 4. add results
    const maxLength = Math.min(results.length, 10)
    for(let i=0; i<maxLength; i++) {
      const r = results[i]
      md += `#### ${r.title}\n`
      md += `【链接】：${r.link}\n`
      md += `【来源】：${r.media}\n`
      md += `【描述】：${r.content}\n\n`
    }

    return {
      markdown: md,
      provider: "zhipu",
      originalResult: chatCompletion,
    }
  }

}

/******************** tool for geo / location ************************/
class GeoLocation {

  private _amapApiKey: string

  constructor() {
    const _env = process.env
    this._amapApiKey = _env.LIU_AMAP_WEB_KEY ?? ""
  }

  preCheck() {
    if(!this._amapApiKey) {
      return checker.getErrResult("amap api key is not set", "E5001")
    }
  }

  postCheck(res: LiuRqReturn) {
    if(res.code !== "0000" || !res.data) {
      const err = checker.getErrResult(
        res.errMsg ?? "network error",
        res.code,
      )
      return err
    }
  }

  private async _handleReqError(
    result: LiuRqReturn,
    reqLink: string,
  ) {
    const errCode = result.code
    console.warn("err code: ", errCode)
    if(errCode !== "B0003") return
    await valTool.waitMilli(2202)
    const newResult = await liuReq(reqLink, undefined, { method: "GET" })
    return newResult
  }

  private async _afterFetchMaps(
    result: LiuRqReturn,
    reqLink: string,
  ): Promise<DataPass<LiuAi.MapResult>> {
    // 1. check if error
    const err1 = this.postCheck(result)
    if(err1) {
      const newResult = await this._handleReqError(result, reqLink)
      if(!newResult) return err1

      // 2. check if err again
      const err2 = this.postCheck(newResult)
      if(err2) return err2

      result = newResult
    }
    const data2 = result.data ?? {}

    // 3. handle return data
    const data3: LiuAi.MapResult = {
      provider: "amap",
      textToBot: valTool.objToStr(data2),
      originalResult: data2,
    }
    console.warn("maps result: ", data2)

    // 4. check more
    if(data2.status !== "1") {
      const reporter = new LiuReporter()
      reporter.sendAny(
        "Fetching Amap Error", 
        data2, 
        `request link: ${reqLink}`
      )
    }

    return {
      pass: true,
      data: data3,
    }
  }

  /**
   * 逆地理编码: 根据经纬度获取地址
   * https://lbs.amap.com/api/webservice/guide/api/georegeo
   */
  async maps_regeo(
    funcJson: Record<string, any>,
    extensions: "all" | "base",
  ): Promise<DataPass<LiuAi.MapResult>> {
    const err1 = this.preCheck()
    if(err1) return err1

    const { latitude, longitude } = funcJson
    const res2_1 = ValueTransform.str2Num(latitude)
    const res2_2 = ValueTransform.str2Num(longitude)
    if(!res2_1.pass || !res2_2.pass) {
      const err2 = checker.getErrResult(
        "latitude and longitude are not numbers",
      )
      return err2
    }
    
    const location = `${res2_2.data},${res2_1.data}`
    const url = new URL("https://restapi.amap.com/v3/geocode/regeo")
    url.searchParams.set("key", this._amapApiKey)
    url.searchParams.set("location", location)
    url.searchParams.set("extensions", extensions)
    const link = url.toString()
    const res3 = await liuReq(link, undefined, { method: "GET" })

    // 4. handle result
    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }

  /**
   * 地理编码: 根据地址获取经纬度
   * https://lbs.amap.com/api/webservice/guide/api/georegeo
   */
  async maps_geo(
    funcJson: Record<string, any>,
  ) {
    const err1 = this.preCheck()
    if(err1) return err1

    const res1 = vbot.safeParse(Ns_MapTool.Sch_GeoParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse maps_geo param: ")
      console.log(funcJson)
      console.log(res1.issues)
      const errRes = checker.getErrResult()
      errRes.err.errMsg = checker.getErrMsgFromIssues(res1.issues)
      return errRes
    }

    const url = new URL("https://restapi.amap.com/v3/geocode/geo")
    url.searchParams.set("key",  this._amapApiKey)
    url.searchParams.set("address", funcJson.address)
    if(funcJson.city) {
      url.searchParams.set("city", funcJson.city)
    }
    const link = url.toString()
    const res3 = await liuReq(link, undefined, { method: "GET" })

    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }

  /**
   * 驾车路径规划
   */
  async maps_direction_driving(
    funcJson: Record<string, any>,
  ) {
    const err1 = this.preCheck()
    if(err1) return err1

    const url = new URL("https://restapi.amap.com/v5/direction/driving")
    const sp = url.searchParams
    sp.set("key", this._amapApiKey)
    sp.set("origin", funcJson.origin)
    sp.set("destination", funcJson.destination)
    const link = url.toString()
    // console.log("maps_direction_driving link::: ", link)
    const res3 = await liuReq(link, undefined, { method: "GET" })

    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }

  /**
   * 步行路径规划
   */
  async maps_direction_walking(
    funcJson: Record<string, any>,
  ) {
    const err1 = this.preCheck()
    if(err1) return err1

    const url = new URL("https://restapi.amap.com/v5/direction/walking")
    const sp = url.searchParams
    sp.set("key", this._amapApiKey)
    sp.set("origin", funcJson.origin)
    sp.set("destination", funcJson.destination)
    const link = url.toString()
    // console.log("maps_direction_walking link::: ", link)
    const res3 = await liuReq(link, undefined, { method: "GET" })

    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }

  /**
   * 单车骑行路径规划
   * https://lbs.amap.com/api/webservice/guide/api/newroute
   */
  async maps_direction_bicycling(
    funcJson: Record<string, any>,
  ) {
    const err1 = this.preCheck()
    if(err1) return err1

    const url = new URL("https://restapi.amap.com/v5/direction/bicycling")
    const sp = url.searchParams
    sp.set("key", this._amapApiKey)
    sp.set("origin", funcJson.origin)
    sp.set("destination", funcJson.destination)
    const link = url.toString()
    // console.log("maps_direction_bicycling link::: ", link)
    const res3 = await liuReq(link, undefined, { method: "GET" })

    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }


  /** 电动车骑行路径规划 */
  async maps_direction_electrobike(
    funcJson: Record<string, any>,
  ) {
    const err1 = this.preCheck()
    if(err1) return err1

    const url = new URL("https://restapi.amap.com/v5/direction/electrobike")
    const sp = url.searchParams
    sp.set("key", this._amapApiKey)
    sp.set("origin", funcJson.origin)
    sp.set("destination", funcJson.destination)
    const link = url.toString()
    // console.log("maps_direction_electrobike link::: ", link)
    const res3 = await liuReq(link, undefined, { method: "GET" })

    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }

  /** 公交路径规划 v3: https://lbs.amap.com/api/webservice/guide/api/direction#t5 */
  async maps_direction_transit(
    funcJson: Record<string, any>,
  ) {
    const err1 = this.preCheck()
    if(err1) return err1
    if(!funcJson.city) {
      const errRes = checker.getErrResult("the param city is required")
      return errRes
    }

    const url = new URL("https://restapi.amap.com/v3/direction/transit/integrated")
    const sp = url.searchParams
    sp.set("key", this._amapApiKey)
    sp.set("origin", funcJson.origin)
    sp.set("destination", funcJson.destination)
    sp.set("city", funcJson.city)
    if(funcJson.cityd) sp.set("cityd", funcJson.cityd)
    if(funcJson.date) sp.set("date", funcJson.date)
    if(funcJson.time) sp.set("time", funcJson.time)
    const link = url.toString()
    // console.log("maps_direction_transit link::: ", link)
    const res3 = await liuReq(link, undefined, { method: "GET" })

    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }

  /** 公交路径规划 v5: https://lbs.amap.com/api/webservice/guide/api/newroute#t8 */
  async maps_direction_transit_more(
    funcJson: Record<string, any>,
  ) {
    const err1 = this.preCheck()
    if(err1) return err1
    if(!funcJson.city1 || !funcJson.city2) {
      const errRes = checker.getErrResult("the params city1 and city2 are required")
      return errRes
    }

    const url = new URL("https://restapi.amap.com/v5/direction/transit/integrated")
    const sp = url.searchParams
    sp.set("key", this._amapApiKey)
    sp.set("origin", funcJson.origin)
    sp.set("destination", funcJson.destination)
    sp.set("city1", funcJson.city1)
    sp.set("city2", funcJson.city2)
    if(funcJson.date) sp.set("date", funcJson.date)
    if(funcJson.time) sp.set("time", funcJson.time)
    const link = url.toString()
    // console.log("maps_direction_transit_more link::: ", link)
    const res3 = await liuReq(link, undefined, { method: "GET" })

    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }

  /**
   *  关键词搜
   *  https://lbs.amap.com/api/webservice/guide/api-advanced/newpoisearch
   */
  async maps_text_search(
    funcJson: Record<string, any>,
  ) {
    const err1 = this.preCheck()
    if(err1) return err1

    const res1 = vbot.safeParse(Ns_MapTool.Sch_TextSearchParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse maps_text_search param: ")
      console.log(funcJson)
      console.log(res1.issues)
      const errRes = checker.getErrResult()
      errRes.err.errMsg = checker.getErrMsgFromIssues(res1.issues)
      return errRes
    }

    const url = new URL("https://restapi.amap.com/v5/place/text")
    url.searchParams.set("key", this._amapApiKey)
    url.searchParams.set("keywords", funcJson.keywords)
    if(funcJson.region) {
      url.searchParams.set("region", funcJson.region)
      url.searchParams.set("city_limit", "true")
    }
    const link = url.toString()
    // console.log("maps_text_search link::: ", link)
    const res3 = await liuReq(link, undefined, { method: "GET" })

    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }

  async maps_around_search(
    funcJson: Record<string, any>,
  ) {
    const err1 = this.preCheck()
    if(err1) return err1

    const res1 = vbot.safeParse(Ns_MapTool.Sch_AroundSearchParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse maps_around_search param: ")
      console.log(funcJson)
      console.log(res1.issues)
      const errRes = checker.getErrResult()
      errRes.err.errMsg = checker.getErrMsgFromIssues(res1.issues)
      return errRes
    }
    
    const url = new URL("https://restapi.amap.com/v5/place/around")
    const sp = url.searchParams
    sp.set("key", this._amapApiKey)
    sp.set("location", funcJson.location)
    if(funcJson.radius) {
      const radiusRes = ValueTransform.str2Num(funcJson.radius)
      if(!radiusRes.pass) {
        const errRes = checker.getErrResult("radius is not a number")
        return errRes
      }
      sp.set("radius", radiusRes.data.toString())
    }
    if(funcJson.sortrule) {
      sp.set("sortrule", funcJson.sortrule)
    }
    const link = url.toString()
    // console.log("maps_around_search link::: ", link)
    const res3 = await liuReq(link, undefined, { method: "GET" })

    const res4 = await this._afterFetchMaps(res3, link)
    return res4
  }
  
}

/******************** shared tools ************************/

export interface ToolSharedOpt {
  bot?: AiBot
  fromSystem2?: boolean
}

export class ToolShared {

  private _user: Table_User
  private _botName = ""
  private _isSystem2 = false

  constructor(
    user: Table_User,
    opt?: ToolSharedOpt,
  ) {
    // 1. init user
    this._user = user

    // 2. handle botName
    let botName = opt?.bot?.name ?? ""
    if(opt?.fromSystem2) {
      const { t } = useI18n(aiLang, { user })
      botName = t("system2_r1")
      this._isSystem2 = true
    }
    this._botName = botName
  }

  async web_search(
    funcJson: Record<string, any>
  ): Promise<DataPass<LiuAi.SearchResult>> {
    // 1. get q
    const q = funcJson.q
    if(typeof q !== "string") {
      console.warn("web_search q is not string")
      return checker.getErrResult("web_search q is not string")
    }

    // 2. call WebSearch.run
    const searchRes = await WebSearch.run(q)
    if(!searchRes) {
      console.warn("fail to search on web")
      return checker.getErrResult("fail to search on web", "E5004")
    }

    return { pass: true, data: searchRes }
  }

  async get_schedule(
    funcJson: Record<string, any>
  ): Promise<DataPass<LiuAi.ReadCardsSharedRes>> {
    // 0. normalize for bots which are not so smart
    if(funcJson.specificDate === "dayAfterTomorrow") {
      funcJson.specificDate = "day_after_tomorrow"
    }
    if(typeof funcJson.hoursFromNow === "number") {
      funcJson.hoursFromNow = String(funcJson.hoursFromNow)
    }

    // 1. checking out param
    const res1 = vbot.safeParse(Sch_AiToolGetScheduleParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse get_schedule param, so we make it default")
      console.log(res1.issues)
      funcJson = {}
    }
    const { 
      hoursFromNow: strHoursFromNow, 
      specificDate,
    } = funcJson as AiToolGetScheduleParam
    const resHoursFromNow = ValueTransform.str2Num(strHoursFromNow)
    const hoursFromNow = resHoursFromNow.pass ? resHoursFromNow.data : undefined

    // 2. construct basic query
    const now = getNowStamp()
    const botName = this._botName
    const user = this._user
    const q2: Record<string, any> = {
      user: user._id,
      spaceType: "ME",
      infoType: "THREAD",
      oState: "OK",
      storageState: "CLOUD",
      aiReadable: "Y",
      calendarStamp: _.gte(now),
    }
    let sortWay: SortWay = "asc"

    // 2.1 define replied text
    const { t } = useI18n(aiLang, { user })
    let textToBot = t("schedule_future")
    let textToUser = t("bot_read_future", { bot: botName })

    // 3. handle hoursFromNow
    if(hoursFromNow) {
      if(hoursFromNow < 0) {
        sortWay = "desc"
        const command3_1 = _.lt(now)
        const command3_2 = _.gte(now + hoursFromNow * HOUR)
        q2.calendarStamp = _.and(command3_1, command3_2)
        textToBot = t("schedule_last", { hour: hoursFromNow })
        textToUser = t("bot_read_last", { bot: botName, hour: hoursFromNow })
      }
      else {
        const command3_3 = _.gt(now)
        const command3_4 = _.lte(now + hoursFromNow * HOUR)
        q2.calendarStamp = _.and(command3_3, command3_4)
        textToBot = t("schedule_next", { hour: hoursFromNow })
        textToUser = t("bot_read_next", { bot: botName, hour: hoursFromNow })
      }
    }

     // 4. handle specificDate
     if(specificDate) {
      const res4 = this._handleGetScheduleForSpecificDate(specificDate)
      if(res4) {
        const command4_1 = _.gte(res4.fromStamp)
        const command4_2 = _.lt(res4.toStamp)
        q2.calendarStamp = _.and(command4_1, command4_2)
        textToBot = res4.textToBot
        textToUser = res4.textToUser
      }
    }

    // 5. to query
    const col5 = db.collection("Content")
    const q5 = col5.where(q2).orderBy("calendarStamp", sortWay)
    const res5 = await q5.limit(10).get<Table_Content>()
    const list5 = res5.data

    // 6. package
    let msg6 = ""
    for(let i=0; i<list5.length; i++) {
      const v = list5[i]
      const card = TransformContent.getCardData(v)
      if(!card) continue
      const msg6_1 = TransformContent.toPlainText(card, user)
      if(!msg6_1) continue
      msg6 += msg6_1
    }

    // 7. has data
    const hasData = Boolean(msg6)
    if(hasData) {
      textToBot += msg6
    }
    else {
      textToBot += t("no_data")
    }

    return {
      pass: true,
      data: { textToBot, textToUser, hasData }
    }
  }

  private _handleGetScheduleForSpecificDate(
    specificDate: AiToolGetScheduleSpecificDate,
  ) {
    // 1. inject required data
    const user = this._user
    const botName = this._botName
    const { t } = useI18n(aiLang, { user })

    // 2. get today
    const now = getNowStamp()
    const userStamp = localizeStamp(now, user.timezone)
    const diffStampBetweenUserAndServer = userStamp - now
    const currentDate = new Date(userStamp)
    const todayDate = date_fn_set(currentDate, {
      hours: 0, minutes: 0, seconds: 0, milliseconds: 0,
    })
    const todayStamp = todayDate.getTime() - diffStampBetweenUserAndServer

    // 3. define return data
    let textToBot = ""
    let textToUser = ""
    let fromStamp: number | undefined
    let toStamp: number | undefined
    
    // 4. if yesterday
    if(specificDate === "yesterday") {
      const yesterdayDate = addDays(todayDate, -1)
      fromStamp = yesterdayDate.getTime() - diffStampBetweenUserAndServer
      toStamp = todayStamp
      textToBot = t("yesterday_schedule")
      textToUser = t("bot_read_yesterday", { bot: botName })
      return { fromStamp, toStamp, textToBot, textToUser }
    }

    const tomorrowDate = addDays(todayDate, 1)
    const tomorrowStamp = tomorrowDate.getTime() - diffStampBetweenUserAndServer
    
    // 5. if today
    if(specificDate === "today") {
      fromStamp = todayStamp
      toStamp = tomorrowStamp
      textToBot = t("today_schedule")
      textToUser = t("bot_read_today", { bot: botName })
      return { fromStamp, toStamp, textToBot, textToUser }
    }

    const dayAfterTomorrow = addDays(todayDate, 2)
    const dayAfterTomorrowStamp = dayAfterTomorrow.getTime() - diffStampBetweenUserAndServer

    // 6. if tomorrow
    if(specificDate === "tomorrow") {
      fromStamp = tomorrowStamp
      toStamp = dayAfterTomorrowStamp
      textToBot = t("tomorrow_schedule")
      textToUser = t("bot_read_tomorrow", { bot: botName })
      return { fromStamp, toStamp, textToBot, textToUser }
    }

    const day3 = addDays(todayDate, 3)
    const day3Stamp = day3.getTime() - diffStampBetweenUserAndServer

    // 7. if day_after_tomorrow
    if(specificDate === "day_after_tomorrow") {
      fromStamp = dayAfterTomorrowStamp
      toStamp = day3Stamp
      textToBot = t("day2_schedule")
      textToUser = t("bot_read_day2", { bot: botName })
      return { fromStamp, toStamp, textToBot, textToUser }
    }

    // 8. calculate this or next week
    const DAY_LIST = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const idx8 = DAY_LIST.indexOf(specificDate)
    if(idx8 < 0) return
    const dayStr = t(specificDate)

    const currentDay = currentDate.getDay()
    let diffDays = idx8 - currentDay
    if(diffDays <= 0) {
      // next week
      diffDays += 7
      textToBot = t("schedule_next_week", { day: dayStr })
      textToUser = t("bot_read_next_week", { bot: botName, day: dayStr })
    }
    else {
      // this week
      textToBot = t("schedule_this_week", { day: dayStr })
      textToUser = t("bot_read_this_week", { bot: botName, day: dayStr })
    }

    fromStamp = addDays(todayDate, diffDays).getTime() - diffStampBetweenUserAndServer
    toStamp = fromStamp + DAY

    return { textToBot, textToUser, fromStamp, toStamp }
  }

  async get_cards(
    funcJson: Record<string, any>,
  ): Promise<DataPass<LiuAi.ReadCardsSharedRes>> {
    const errRes = checker.getErrResult()

    // 1. checking out param
    const res1 = vbot.safeParse(Sch_AiToolGetCardsParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse get_cards param: ")
      console.log(funcJson)
      console.log(res1.issues)
      errRes.err.errMsg = checker.getErrMsgFromIssues(res1.issues)
      return errRes
    }
    const cardType = funcJson.cardType as AiToolGetCardType

    // 2. construct basic query
    const botName = this._botName
    const user = this._user
    const userId = user._id
    const q2: Record<string, any> = {
      user: userId,
      spaceType: "ME",
      infoType: "THREAD",
      oState: "OK",
      storageState: "CLOUD",
      aiReadable: "Y",
    }

    // 2.1 define replied text
    let textToBot = ""
    let textToUser = ""
    const { t } = useI18n(aiLang, { user })
    let contents: Table_Content[] | undefined

    // 3. get contents
    const cCol = db.collection("Content")
    if(cardType === "TODO" || cardType === "FINISHED") {
      q2.stateId = cardType
      const q3_0 = cCol.where(q2).orderBy("stateStamp", "desc").limit(10)
      const res3_0 = await q3_0.get<Table_Content>()
      contents = res3_0.data
      if(cardType === "TODO") {
        textToBot = t("todo_cards")
        textToUser = t("bot_read_todo", { bot: botName })
      }
      else if(cardType === "FINISHED") {
        textToBot = t("finished_cards")
        textToUser = t("bot_read_finished", { bot: botName })
      }
    }
    else if(cardType === "EVENT") {
      q2.calendarStamp = _.gt(getNowStamp() - DAY)
      const q3_1 = cCol.where(q2).orderBy("createdStamp", "desc").limit(10)
      const res3_1 = await q3_1.get<Table_Content>()
      contents = res3_1.data
      textToBot = t("event_cards")
      textToUser = t("bot_read_event", { bot: botName })
    }
    else {
      const q3_2 = cCol.where(q2).orderBy("createdStamp", "desc").limit(10)
      const res3_2 = await q3_2.get<Table_Content>()
      contents = res3_2.data
      textToBot = t("note_cards")
      textToUser = t("bot_read_note", { bot: botName })
    }

    // 6. package
    let msg6 = ""
    for(let i=0; i<contents.length; i++) {
      const v = contents[i]
      const card = TransformContent.getCardData(v)
      if(!card) continue
      const msg6_1 = TransformContent.toPlainText(card, user)
      if(!msg6_1) continue
      msg6 += msg6_1
    }

    // 7. has data
    const hasData = Boolean(msg6)
    if(hasData) {
      textToBot += msg6
    }
    else {
      textToBot += t("no_data")
    }

    return {
      pass: true,
      data: { textToBot, textToUser, hasData }
    }
  }

  async parse_link(
    funcJson: Record<string, any>
  ): Promise<DataPass<LiuAi.ParseLinkResult>> {
    // 1. check out if the link is valid
    const link = funcJson.link
    if(!valTool.isStringWithVal(link)) {
      console.warn("it is not a valid link:", funcJson)
      return checker.getErrResult("parameter link is not valid")
    }

    // 2. to fetch
    const url = `https://r.jina.ai/${link}`
    const res2 = await liuFetch(url, { 
      method: "POST",
      headers: {
        "X-Timeout": "30",
      }
    })

    // 3. handle result
    let text3 = res2.data?.text
    if(!text3) {
      console.warn("parsing link failed!")
      console.log(res2)
      return checker.getErrResult("parsing link failed", "E5004")
    }
    
    return {
      pass: true,
      data: {
        markdown: text3,
        provider: "jina-ai"
      }
    }
  }

  private getEssentialReplyData(assistantChatId: string) {
    const user = this._user
    const botName = this._botName
    const { t } = useI18n(aiLang, { user })
    const { agreeLink, editLink } = ToolShared.getAgreeAndEditLinks(assistantChatId)
    return { t, agreeLink, editLink, botName }
  }

  static getAgreeAndEditLinks(assistantChatId: string) {
    const domain = getLiuDoman()

    const agreeLink = `${domain}/agree?chatId=${assistantChatId}`
    const editLink = `${domain}/compose?chatId=${assistantChatId}`

    return { agreeLink, editLink }
  }

  get_msg_for_adding_note(
    funcJson: Record<string, any>,
    assistantChatId: string,
  ) {
    const { 
      t, 
      agreeLink, 
      editLink, 
      botName,
    } = this.getEssentialReplyData(assistantChatId)
    let msg = ""
    const { title, description } = funcJson
    if(title) {
      msg = t("add_note_with_title", { botName, title, desc: description, agreeLink, editLink })
    }
    else {
      msg = t("add_note_only_desc", { botName, desc: description, agreeLink, editLink })
    }
    return msg
  }

  get_msg_for_adding_todo(
    assistantChatId: string,
    funcJson: Record<string, any>,
  ) {
    const { 
      t, 
      agreeLink, 
      editLink, 
      botName,
    } = this.getEssentialReplyData(assistantChatId)
    const { title } = funcJson
    let msg = t("add_todo", { botName, title, agreeLink, editLink })
    return msg
  }

  get_msg_for_adding_calendar(
    assistantChatId: string,
    funcJson: Record<string, any>,
  ) {
    const { 
      t, 
      agreeLink, 
      editLink, 
      botName,
    } = this.getEssentialReplyData(assistantChatId)
    const {
      title,
      description,
      date,
      specificDate,
      time,
      earlyMinute: strEarlyMinute,
      laterHour: strLaterHour,
    } = funcJson as AiToolAddCalendarParam
    let msg = t("add_calendar_1", { botName })
    if(title) {
      msg += t("add_calendar_2", { title })
    }
    msg += t("add_calendar_3", { desc: description })
    const resEarlyMinute = ValueTransform.str2Num(strEarlyMinute)
    const earlyMinute = resEarlyMinute.pass ? resEarlyMinute.data : undefined
    const resLaterHour = ValueTransform.str2Num(strLaterHour)
    const laterHour = resLaterHour.pass ? resLaterHour.data : undefined

    /** Priority:
     *   date > specificDate > laterHour
     */
    // 3.1 handle date
    let hasAddedDate = false
    if(date) {
      const dateObj = LiuDateUtil.distractFromYYYY_MM_DD(date)
      if(dateObj) {
        hasAddedDate = true
        msg += t("add_calendar_4", { date })
      }
    }
    if(specificDate && !hasAddedDate) {
      const strDate = t(specificDate)
      if(strDate) {
        hasAddedDate = true
        msg += t("add_calendar_4", { date: strDate })
      }
    }

    // 3.2 handle time
    let hasAddedTime = false
    if(time) {
      const timeObj = LiuDateUtil.distractFromhh_mm(time)
      if(timeObj) {
        hasAddedTime = true
        msg += t("add_calendar_5", { time })
      }
    }
    if(earlyMinute && hasAddedTime) {
      let strReminder = ""
      if(earlyMinute < 60) {
        strReminder = t("early_min", { min: earlyMinute })
      }
      else if(earlyMinute === 60 || earlyMinute === 120) {
        const tmpHrs = Math.round(earlyMinute / 60)
        strReminder = t("early_hr", { hr: tmpHrs })
      }
      else if(earlyMinute === 1440) {
        strReminder = t("early_day", { day: 1 })
      }
      if(strReminder) {
        msg += t("add_calendar_6", { str: strReminder })
      }
    }

    // 3.3 handle later
    if(laterHour && !hasAddedTime && !hasAddedDate) {
      let strLater = ""
      if(laterHour === 0.5) {
        strLater = t("later_min", { min: 30 })
      }
      else if(laterHour < 24) {
        strLater = t("later_hr", { hr: laterHour })
      }
      else if(laterHour === 24) {
        strLater = t("later_day", { day: 1 })
      }
      if(strLater) {
        msg += t("add_calendar_6", { str: strLater })
      }
    }

    // 3.4 add footer
    msg += t("add_calendar_7", { agreeLink, editLink })

    return msg
  }

  async maps_regeo(funcJson: Record<string, any>) {
    // 0. get params
    const extensions = this._isSystem2 ? "all" : "base"

    // 1. call GeoLocation
    const geo = new GeoLocation()
    const res1 = await geo.maps_regeo(funcJson, extensions)
    if(!res1.pass) return res1

    // 2. add textToUser
    const bot = this._botName
    const { t: t1 } = useI18n(aiLang, { user: this._user })
    let textToUser = t1("parse_latlng", { bot })

    // 3. add a link to tap
    const url3 = new URL("https://uri.amap.com/marker")
    const location = `${funcJson.longitude},${funcJson.latitude}`
    url3.searchParams.set("location", location)
    textToUser = this.packageLinkForAmap(url3, textToUser, "0")
    
    res1.data.textToUser = textToUser
    return res1
  }

  async maps_geo(funcJson: Record<string, any>) {
    // 1. call GeoLocation
    const geo = new GeoLocation()
    const res1 = await geo.maps_geo(funcJson)
    if(!res1.pass) return res1

    // 2. add textToUser
    const bot = this._botName
    const { t } = useI18n(aiLang, { user: this._user })
    let textToUser = t("see_map", { bot })

    // 3. add a link to tap
    const url3 = new URL("https://uri.amap.com/search")
    url3.searchParams.set("keyword", funcJson.address)
    url3.searchParams.set("view", "map")
    if(funcJson.city) {
      url3.searchParams.set("city", funcJson.city)
    }
    textToUser = this.packageLinkForAmap(url3, textToUser)

    res1.data.textToUser = textToUser
    return res1
  }

  async maps_text_search(funcJson: Record<string, any>) {
    // 1. call GeoLocation
    const geo = new GeoLocation()
    const res1 = await geo.maps_text_search(funcJson)
    if(!res1.pass) return res1

    // 2. add textToUser
    const bot = this._botName
    const { t } = useI18n(aiLang, { user: this._user })
    const textToUser = t("search_address", { bot })
    res1.data.textToUser = textToUser
    return res1
  }

  async maps_around_search(funcJson: Record<string, any>) {
    // 1. call GeoLocation
    const geo = new GeoLocation()
    const res1 = await geo.maps_around_search(funcJson)
    if(!res1.pass) return res1

    // 2. add textToUser
    const bot = this._botName
    const { t } = useI18n(aiLang, { user: this._user })
    const textToUser = t("search_around", { bot })
    res1.data.textToUser = textToUser
    return res1
  }

  private aMapDirectionToMode: Record<Ns_MapTool.DirectionType, string> = {
    "driving": "car",
    "walking": "walk",
    "bicycling": "ride",
    "electrobike": "ride",
    "transit": "bus",
  }

  async maps_direction(
    funcJson: Record<string, any>,
  ): Promise<DataPass<LiuAi.MapResult>> {
    // 1. check out params
    const sch1 = this._isSystem2 ? Ns_MapTool.Sch_RouteParam : Ns_MapTool.Sch_DirectionParam
    const res1 = vbot.safeParse(sch1, funcJson)
    if(!res1.success) {
      console.warn("cannot parse maps_direction param:")
      console.log(funcJson)
      const errMsg = checker.getErrMsgFromIssues(res1.issues)
      const errRes = checker.getErrResult(errMsg)
      return errRes
    }

    // 2. check out origin and destination
    const { origin, destination } = funcJson
    const origin2 = ValueTransform.splitInto2Num(origin)
    const destination2 = ValueTransform.splitInto2Num(destination)
    if(!origin2 || !destination2) {
      console.warn("cannot parse origin or destination")
      const errRes = checker.getErrResult("fail to parse origin or destination")
      return errRes
    }

    // 3. decide to go
    const d = funcJson.direction as Ns_MapTool.DirectionType
    let res3: DataPass<LiuAi.MapResult> | undefined
    const geo = new GeoLocation()
    if(d === "driving") {
      res3 = await geo.maps_direction_driving(funcJson)
    }
    else if(d === "walking") {
      res3 = await geo.maps_direction_walking(funcJson)
    }
    else if(d === "bicycling") {
      res3 = await geo.maps_direction_bicycling(funcJson)
    }
    else if(d === "electrobike") {
      res3 = await geo.maps_direction_electrobike(funcJson)
    }
    else if(d === "transit") {
      if(this._isSystem2) {
        res3 = await geo.maps_direction_transit_more(funcJson)
      } else {
        res3 = await geo.maps_direction_transit(funcJson)
      }
    }
    if(!res3) {
      return { 
        pass: false, 
        err: { code: "E4000", errMsg: "direction is not legal" },
      }
    }
    if(!res3.pass) return res3

    // 4. add textToUser
    const bot = this._botName
    const { t: t1 } = useI18n(aiLang, { user: this._user })
    let textToUser = t1("route_plan", { bot })

    // 5. add a link to tap
    const url5 = new URL("https://uri.amap.com/navigation")
    const sp5 = url5.searchParams
    sp5.set("from", origin)
    sp5.set("to", destination)
    sp5.set("mode", this.aMapDirectionToMode[d])
    textToUser = this.packageLinkForAmap(url5, textToUser)

    res3.data.textToUser = textToUser
    return res3
  }

  private packageLinkForAmap(
    url: URL,
    oldTextToUser: string,
    callnative = "1",
  ) {
    const appName = getAppName({ user: this._user })
    url.searchParams.set("src", appName)
    url.searchParams.set("callnative", callnative)
    const link = url.toString()
    return `<a href="${link}">${oldTextToUser}</a>`
  }

}

/******************** tool for painting ************************/

interface PaletteSpecificOpt {
  apiKey: string
  baseUrl: string
  model: string
}

export class Palette {

  static async run(
    prompt: string,
    sizeType: AiImageSizeType,
  ) {
    const _env = process.env
    const sfUrl = _env.LIU_SILICONFLOW_BASE_URL
    const sfApiKey = _env.LIU_SILICONFLOW_API_KEY
    const sfModel = _env.LIU_SILICONFLOW_IMAGE_GENERATION_MODEL
    
    // 1. run by siliconflow
    if(sfUrl && sfApiKey && sfModel) {
      const opt1: PaletteSpecificOpt = {
        apiKey: sfApiKey,
        baseUrl: sfUrl,
        model: sfModel,
      }
      const res1 = await this.runBySiliconflow(prompt, sizeType, opt1)
      return res1
    }
  }

  static async runByStepfun(
    prompt: string,
    sizeType: AiImageSizeType,
  ) {
    // 1. get api key and base url
    const _env = process.env
    const apiKey = _env.LIU_STEPFUN_API_KEY
    const baseUrl = _env.LIU_STEPFUN_BASE_URL
    if(!apiKey || !baseUrl) {
      console.warn("there is no apiKey or baseUrl of stepfun in Palette")
      return
    }

    // 2. construct url
    const model = "step-1x-medium"
    const url = baseUrl + "images/generations"
    const headers = { "Authorization": `Bearer ${apiKey}` }
    const body = {
      model,
      prompt,
      size: sizeType === "square" ? "1024x1024" : "800x1280",
    }
    console.warn("start to draw with ", model)
    console.log(prompt)

    try {
      const stamp1 = getNowStamp()
      const res = await liuReq<Ns_Stepfun.ImagesGenerationsRes>(
        url, 
        body, 
        { headers }
      )
      const stamp2 = getNowStamp()
      const durationStamp = stamp2 - stamp1
      if(res.code === "0000" && res.data) {
        const parseResult = this._parseFromStepfun(res.data, model, durationStamp, prompt)
        return parseResult
      }
      console.warn("palette runByStepfun got an unexpected result: ")
      console.log(res)
    }
    catch(err) {
      console.warn("palette runByStepfun error: ")
      console.log(err)
    }

  }

  private static _parseFromStepfun(
    res: Ns_Stepfun.ImagesGenerationsRes,
    model: string,
    durationStamp: number,
    prompt: string,
  ): LiuAi.PaletteResult | undefined {
    // 1. get duration
    const duration = valTool.numToFix(durationStamp, 2)
    if(isNaN(duration)) {
      console.warn("cannot parse duration in _parseFromStepfun: ")
      console.log(res)
      return
    }

    console.log("_parseFromStepfun res: ")
    console.log(res)

    // 2. get img
    const theImg = res.data?.[0]
    const url = theImg?.url
    if(!url) {
      console.warn("cannot get the image url in _parseFromStepfun: ")
      console.log(res)
      return
    }

    return {
      url,
      prompt,
      model,
      duration,
      originalResult: res,
    }
  }

  static async runByZhipu(
    prompt: string,
    sizeType: AiImageSizeType,
  ) {
    // 1. get api key and base url
    const _env = process.env
    const apiKey = _env.LIU_ZHIPU_API_KEY
    const baseUrl = _env.LIU_ZHIPU_BASE_URL
    if(!apiKey || !baseUrl) {
      console.warn("there is no apiKey or baseUrl of zhipu in Palette")
      return
    }

    // 2. construct url, headers, and body
    const model = "cogview-3-plus"
    const url = baseUrl + "images/generations"
    const headers = { "Authorization": `Bearer ${apiKey}` }
    const body = {
      model,
      prompt,
      size: sizeType === "square" ? "1024x1024" : "768x1344",
    }
    
    console.warn("start to draw with ", model)
    console.log(prompt)

    try {
      const stamp1 = getNowStamp()
      const res = await liuReq<Ns_Zhipu.ImagesGenerationsRes>(
        url, 
        body, 
        { headers }
      )
      const stamp2 = getNowStamp()
      const durationStamp = stamp2 - stamp1
      if(res.code === "0000" && res.data) {
        const parseResult = this._parseFromZhipu(res.data, model, durationStamp, prompt)
        return parseResult
      }
      console.warn("palette runByZhipu got an unexpected result: ")
      console.log(res)
    }
    catch(err) {
      console.warn("palette runByZhipu error: ")
      console.log(err)
    }
  }

  private static _parseFromZhipu(
    res: Ns_Zhipu.ImagesGenerationsRes | Ns_Zhipu.ErrorResponse,
    model: string,
    durationStamp: number,
    prompt: string,
  ): LiuAi.PaletteResult | undefined {
    // 1. get duration
    const duration = valTool.numToFix(durationStamp, 2)
    if(isNaN(duration)) {
      console.warn("cannot parse duration in _parseFromZhipu: ")
      console.log(res)
      return
    }

    // 2. get url
    const successRes = res as Ns_Zhipu.ImagesGenerationsRes
    const failRes = res as Ns_Zhipu.ErrorResponse
    const url = successRes.data?.[0]?.url
    if(!url) {
      console.warn("cannot get the image url in _parseFromZhipu: ")
      console.log(failRes)
      return
    }

    return {
      url,
      prompt,
      model,
      duration,
      originalResult: res,
    }
  }

  static async runBySiliconflow(
    prompt: string,
    sizeType: AiImageSizeType,
    opt: PaletteSpecificOpt,
  ) {

    // 1. construct headers and body
    const url = opt.baseUrl + "/images/generations"
    const headers = {
      "Authorization": `Bearer ${opt.apiKey}`,
    }
    // reference: https://docs.siliconflow.cn/api-reference/images/images-generations
    const body: Record<string, any> = {
      model: opt.model,
      prompt,
      image_size: sizeType === "square" ? "1024x1024" : "768x1024",
      num_inference_steps: 20,
    }

    // 2.1 for stable diffusion
    if(opt.model.includes("stable-diffusion")) {
      body.batch_size = 1
      body.guidance_scale = 7.5 
    }

    console.warn("start to draw with ", opt.model)
    console.log(prompt)

    // 3. to fetch
    try {
      const res3 = await liuReq<Ns_SiliconFlow.ImagesGenerationsRes>(
        url, 
        body, 
        { headers }
      )

      if(res3.code === "0000" && res3.data) {
        const parseResult = this._parseFromSiliconflow(res3.data, opt.model, prompt)
        return parseResult
      }

      console.warn("palette runBySiliconflow got an unexpected result: ")
      console.log(res3)
    }
    catch(err) {
      console.warn("palette runBySiliconflow error: ")
      console.log(err)
    }
  }

  private static _parseFromSiliconflow(
    data: Ns_SiliconFlow.ImagesGenerationsRes,
    model: string,
    prompt: string,
  ): LiuAi.PaletteResult | undefined {
    const img = data.images?.[0]
    if(!img) return
    const inference = data.timings?.inference
    if(!inference) return
    const url = img.url

    if(model.indexOf("/") > 0) {
      const tmpList = model.split("/")
      model = tmpList[tmpList.length - 1]
    }

    const duration = valTool.numToFix(inference, 2)
    if(isNaN(duration)) {
      console.warn("cannot parse duration from siliconflow: ")
      console.log(data)
      return
    }

    return {
      url,
      model,
      prompt,
      duration,
      originalResult: data,
    }
  }

}

export class Translator {

  private _bot?: AiBot
  private _user?: Table_User

  constructor(bot?: AiBot, user?: Table_User) {
    this._bot = bot
    this._user = user
  }

  async run(
    text: string,
  ): Promise<LiuAi.TranslateResult | undefined> {
    // 1. get apiEndpoint
    let apiEndpoint: LiuAi.ApiEndpoint | undefined
    const bot = this._bot
    const canUseChat = bot?.abilities.includes("chat")
    if(canUseChat && bot) {
      apiEndpoint = AiShared.getApiEndpointFromBot(bot)
    }
    let model = bot?.model
    if(!apiEndpoint || !model) {
      const _env = process.env
      const baseURL = _env.LIU_TRANSLATION_BASE_URL
      const apiKey = _env.LIU_TRANSLATION_API_KEY
      model = _env.LIU_TRANSLATION_MODEL
      if(!apiKey || !baseURL || !model) {
        console.warn("there is no apiKey or baseUrl in Translator")
        return
      }
      apiEndpoint = { apiKey, baseURL }
    }

    // 2. get prompts
    const { p } = aiI18nShared({ type: "translate", user: this._user})
    const prompts: OaiPrompt[] = [
      { role: "system", content: p("system") },
      { role: "user", content: p("user_1") },
      { role: "assistant", content: p("assistant_1") },
      { role: "user", content: p("user_2") },
      { role: "assistant", content: p("assistant_2") },
      { role: "user", content: p("user_3") },
      { role: "assistant", content: p("assistant_3") },
      { role: "user", content: p("user_4") },
      { role: "assistant", content: p("assistant_4") },
      { role: "user", content: p("user_5") },
      { role: "assistant", content: p("assistant_5") },
      { role: "user", content: p("user_6") },
      { role: "assistant", content: p("assistant_6") },
      { role: "user", content: text },
    ]

    // 3. chat 
    const llm = new BaseLLM(apiEndpoint.apiKey, apiEndpoint.baseURL)
    const res3 = await llm.chat({ model, messages: prompts })
    if(!res3) {
      console.warn("no res3 in Translator")
      return
    }

    // 4. get translatedText
    const {
      content: translatedText,
    } = AiShared.getContentFromLLM(res3, this._bot)
    if(!translatedText) {
      console.warn("no translatedText in Translator")
      return
    }

    // 5. return 
    const res5: LiuAi.TranslateResult = {
      originalText: text,
      translatedText,
      model,
    }
    console.log("see translate result: ")
    console.log(res5)
    return res5
  }


}

export class TransformContent {

  static getCardData(v: Table_Content) {
    const data = decryptEncData(v)
    if(!data.pass) return
    const summary = RichTexter.getSummary(data.liuDesc)
    const obj: LiuAi.CardData = {
      title: data.title ?? "",
      summary,
      contentId: v._id,
      hasImage: Boolean(data.images?.length),
      hasFile: Boolean(data.files?.length),
      calendarStamp: v.calendarStamp,
      createdStamp: v.createdStamp,
    }
    return obj
  }

  static toPlainText(v: LiuAi.CardData, user?: Table_User) {
    let msg = ""

    // title
    if(v.title) {
      msg += `  <title>${v.title}</title>\n`
    }

    // summary
    if(v.summary) {
      msg += `  <summary>${v.summary}</summary>\n`
    }
    else if(v.hasImage) {
      msg += `  <summary>[Image]</summary>\n`
    }
    else if(v.hasFile) {
      msg += `  <summary>[File]</summary>\n`
    }

    // calendarStamp
    const locale = getCurrentLocale({ user })
    if(v.calendarStamp) {
      const dateStr = LiuDateUtil.displayTime(v.calendarStamp, locale, user?.timezone)
      msg += `  <date>${dateStr}</date>\n`
    }
    if(!msg) return

    // created
    const createdStr = LiuDateUtil.displayTime(v.createdStamp, locale, user?.timezone)
    msg += `  <created>${createdStr}</created>\n`
    msg = `<${v.contentId}>\n${msg}</${v.contentId}>`
    return msg
  }


  static convertTextBeforeReplying(
    text: string,
    user?: Table_User,
  ) {
    // 1. try to structure text first
    const txt1 = this.structureText(text, user)
    if(txt1 !== text) return txt1
    const originalText = text

    /**
     *  2. extract text like:
     *  {
     *    "msgtype": "location",
     *    "latitude": "30.168669",
     *    "longitude": "120.134827",
     *    "title": "浙江省杭州市滨江区浦沿街道滨文路868号",
     *    "address": "浙江省杭州市滨江区浦沿街道滨文路868号"
     *  }
     * 
     * 这个位置位于浙江省杭州市滨江区的浦沿街道......
     */
    const idx2_1 = originalText.indexOf("{")
    const idx2_2 = originalText.indexOf("}")
    if(idx2_1 < 0 || idx2_2 < 1) return text
    if(idx2_1 > idx2_2) return text
    const str2 = originalText.substring(idx2_1, idx2_2 + 1)
    const txt2 = this.structureText(str2, user)

    // 3.1 如果结构化“失败”，代表文本出现乱码（错误的代码）
    // 返回 undefined 这样就不会传给用户
    if(!txt2) return

    // 3.2 如果文本长度前后一致，代表没有进行结构化，返回原文本
    if(txt2.length === str2.length) return txt2

    // 3.3 如果文本长度前后不一致，看看原文本尾部还有没有消息
    // 若还存有一些消息量，将消息添加到结构化后的文本后面
    if(originalText.length > idx2_2 + 1) {
      const txt3 = originalText.substring(idx2_2 + 1).trim()
      if(txt3.length > 5) {
        return txt2 + "\n\n" + txt3
      }
    }
    
    return txt2
  }

  /**
   * 结构化文本:
   * 如果不是 json 格式，直接返回原文本
   * 如果是 json 格式，但结构化失败，直接返回 undefined
   * 如果结构化成功，返回结构化后的文本
   */
  static structureText(
    text: string,
    user?: Table_User,
  ) {
    if(!text.startsWith("{")) return text
    if(!text.endsWith("}")) return text
    let newText = text

    // 1. structure text to location
    const res1 = valTool.strToObj(text)
    
    // 2. if it's a location
    if(res1.msgtype === "location") {
      const res2 = this._turnIntoMapInfo(res1, user)
      if(!res2) return
      newText = res2
    }
    
    return newText
  }


  private static _turnIntoMapInfo(
    obj: Record<string, any>,
    user?: Table_User,
  ) {
    const { latitude, longitude, title, address } = obj

    // 1. check out params
    const res1 = ValueTransform.str2Num(latitude)
    const res2 = ValueTransform.str2Num(longitude)
    if(!res1.pass || !res2.pass) return
    if(!title || typeof title !== "string") return

    // 2. init msg
    const { t: t1 } = useI18n(aiLang, { user })
    const { t: t2 } = useI18n(commonLang, { user })
    let msg = t1("location_msg") + "\n\n"

    // 2.1 add title
    msg += (title + "\n")

    // 2.2 add address
    let hasAddress = Boolean(address && typeof address === "string" && address !== title)
    if(hasAddress) {
      msg += (address + "\n")
    }
    msg += "\n"

    // 2.3 add amap link
    const amapUrl = new URL("https://uri.amap.com/marker")
    const amapSp = amapUrl.searchParams
    amapSp.set("position", `${longitude},${latitude}`)
    amapSp.set("name", title)
    amapSp.set("src", t2("appName"))
    amapSp.set("callnative", "1")
    const amapLink = amapUrl.toString()
    msg += `<a href="${amapLink}">${t1('open_via_amap')}</a>\n`

    // 2.4 add baidu link
    const baiduUrl = new URL("http://api.map.baidu.com/marker")
    const baiduSp = baiduUrl.searchParams
    baiduSp.set("location", `${latitude},${longitude}`)
    baiduSp.set("title", title)
    if(hasAddress) {
      baiduSp.set("content", address)
    }
    else {
      baiduSp.set("content", t2("from_us"))
    }
    baiduSp.set("src", "webapp.ptsd.liubai")
    baiduSp.set("output", "html")
    baiduSp.set("coord_type", "gcj02")
    const baiduLink = baiduUrl.toString()
    msg += `<a href="${baiduLink}">${t1('open_via_baidu')}</a>`

    return msg
  }

}

export class LogHelper {

  static kick(
    characters: AiCharacter[],
    user?: Table_User,
  ) {
    const row: Partial<Table_LogAi> = {
      infoType: "kick_character",
      characters,
      userId: user?._id,
    }
    this._insert(row)
  }

  static add(
    characters: AiCharacter[],
    user?: Table_User,
  ) {
    const row: Partial<Table_LogAi> = {
      infoType: "add_character",
      characters,
      userId: user?._id,
    }
    this._insert(row)
  }

  static _insert(log: Partial<Table_LogAi>) {
    const b1 = getBasicStampWhileAdding()
    log = { ...b1, ...log }
    const logCol = db.collection("LogAi")
    logCol.add(log)
  }

  static printLastItems(
    messages: Array<Record<string, any>>,
    lastNum = 5,
  ) {
    const msgLength = messages.length
    // console.log(`print last ${lastNum} prompts: `)
    if(msgLength > lastNum) {
      const messages2 = messages.slice(msgLength - lastNum)
      const printMsg = valTool.objToStr({ messages: messages2 })
      console.log(printMsg)
    }
    else {
      const printMsg = valTool.objToStr({ messages })
      console.log(printMsg)
    }
  }

  static printLastChars(
    text: string,
    lastNum = 1000,
  ) {
    const tLength = text.length
    if(tLength <= lastNum) {
      console.log(text)
      return
    }
    const startIdx = tLength - lastNum
    const printMsg = "......" + text.substring(startIdx)
    console.log(printMsg)
  }

}