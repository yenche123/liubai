// Function Name: ai-entrance

import { 
  type AiBot,
  type AiCharacter,
  type AiUsage,
  type AiEntry,
  type AiCommandByHuman,
  type OaiPrompt,
  type OaiTool,
  type OaiToolPrompt,
  type OaiToolCall,
  type OaiMessage,
  type OaiCreateParam,
  type OaiChatCompletion,
  type Partial_Id, 
  type Table_AiChat, 
  type Table_AiRoom, 
  type Table_User, 
  type Wx_Gzh_Send_Msg,
  type Wx_Gzh_Send_Msgmenu_Item,
  type Wx_Gzh_Send_Msgmenu,
  type Table_Order,
  type Table_Subscription,
  type AiFinishReason,
  type AiToolAddCalendarParam,
  AiAbility,
  T_I18N,
  ZhipuBigModel,
  LiuAi,
  Sch_AiToolGetScheduleParam,
  Sch_AiToolGetCardsParam,
  AiToolGetCardType,
} from "@/common-types"
import OpenAI from "openai"
import { 
  checkAndGetWxGzhAccessToken, 
  checkIfUserSubscribed, 
  getDocAddId,
  valTool,
  createAvailableOrderId,
  LiuDateUtil,
  getLiuDoman,
  MarkdownParser,
  AiToolUtil,
  liuReq,
} from "@/common-util"
import { WxGzhSender } from "@/service-send"
import { 
  getBasicStampWhileAdding, 
  getNowStamp, 
  MINUTE,
} from "@/common-time"
import { 
  aiBots, 
  aiI18nChannel, 
  aiI18nShared,
  aiTools,
} from "@/ai-prompt"
import cloud from "@lafjs/cloud"
import { useI18n, aiLang } from "@/common-i18n"
import * as vbot from "valibot"

const db = cloud.database()
const _ = db.command

/********************* constants ***********************/
const MAX_CHARACTERS = 3
const MIN_RESERVED_TOKENS = 1600
const TOKEN_NEED_COMPRESS = 6000
const MAX_WX_TOKEN = 360  // wx gzh will send 45002 error if we send too many words once
const MIN_REST_TOKEN = 100
const MAX_WORDS = 3000

const MAX_TIMES_FREE = 10
const MAX_TIMES_MEMBERSHIP = 200

const MIN_3 = MINUTE * 3
const MIN_30 = MINUTE * 30

/************************** types ************************/

interface AiDirectiveCheckRes {
  theCommand: AiCommandByHuman
  theBot?: AiBot
}

// pass it to aiController.run() and bot.run()
interface AiRunParam {
  entry: AiEntry
  room: Table_AiRoom
  chatId?: string
  chats: Table_AiChat[]
  isContinueCommand?: boolean
}

interface AiRunSuccess {
  character: AiCharacter
  replyStatus: "yes" | "has_new_msg"
  assistantChatId?: string
  chatCompletion?: OaiChatCompletion
}

type AiRunResults = Array<AiRunSuccess | undefined>

interface AiHelperAssistantMsgParam {
  roomId: string
  text?: string
  model: string
  character: AiCharacter
  usage?: AiUsage
  requestId?: string
  baseUrl?: string
  funcName?: string
  funcJson?: Record<string, any>
  tool_calls?: OaiToolCall[]
  finish_reason?: AiFinishReason
  webSearchProvider?: LiuAi.SearchProvider
  webSearchData?: Record<string, any>
}

interface AiMenuItem {
  operation: AiCommandByHuman
  character?: AiCharacter
}

interface PreRunResult {
  prompts: OaiPrompt[]
  totalToken: number
  bot: AiBot
  chats: Table_AiChat[]
  tools?: OaiTool[]
}

interface PostRunParam {
  aiParam: AiRunParam
  chatParam: OaiCreateParam
  chatCompletion?: OaiChatCompletion
  bot: AiBot
}

interface TurnChatsIntoPromptOpt {
  abilities?: AiAbility[]
}

/********************* empty function ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with ai-entrance")
  return true
}


export async function enter_ai(
  entry: AiEntry,
) {
  // 0. pre check
  const res0 = preCheck()
  if(!res0) return

  // 1. check out text or image_url
  const { msg_type, image_url, text, file_base64 } = entry
  if(msg_type === "text" && !text) return
  if(msg_type === "image" && !image_url) return
  if(msg_type === "voice" && !file_base64) return

  // 1.1 check out text
  if(msg_type === "text" && text) {
    const res1_1 = preCheckText(text, entry)
    if(!res1_1) return
  }

  // 2. check out directive
  const theDirective = AiDirective.check(entry)
  if(theDirective && theDirective.theCommand !== "continue") {
    return
  }

  // 3. check out quota
  const isQuotaEnough = await AiHelper.checkQuota(entry)
  if(!isQuotaEnough) return

  // 4. get my ai room
  const room = await AiHelper.getMyAiRoom(entry)
  if(!room) return
  const roomId = room._id

  // 4.1 check out if it's "continue" command
  if(theDirective?.theCommand === "continue") {
    const controller4_1 = new ContinueController(
      entry, 
      room, 
      theDirective?.theBot?.character
    )
    controller4_1.run()
    return
  }

  // 5. add the current message into db
  const chatId = await AiHelper.addUserMsg(entry, roomId)
  if(!chatId) return

  // 6. get latest chat records
  const res6 = await AiHelper.getLatestChat(roomId)

  // 7. run AI!
  const controller = new AiController()
  controller.run({ entry, room, chatId, chats: res6 })

}


function preCheck() {
  const _env = process.env
  const summaryBaseUrl = _env.LIU_SUMMARY_BASE_URL
  const summaryApiKey = _env.LIU_SUMMARY_API_KEY
  const summaryModel = _env.LIU_SUMMARY_MODEL
  if(!summaryBaseUrl || !summaryApiKey || !summaryModel) {
    console.warn("summary is not available")
    return false
  }

  const domain = _env.LIU_DOMAIN
  if(!domain) {
    console.warn("domain is not set")
    return false
  }

  return true
}

function preCheckText(text: string, entry: AiEntry) {
  if(text.length > MAX_WORDS) {
    const { t } = useI18n(aiLang, { user: entry.user })
    const msg = t("too_many_words")
    TellUser.text(entry, msg)
    return false
  }

  return true
}


function mapBots(
  c: AiCharacter,
  aiParam: AiRunParam,
  promises: Promise<AiRunSuccess | undefined>[],
) {
  if(c === "deepseek") {
    const bot1 = new BotDeepSeek()
    const pro1 = bot1.run(aiParam)
    promises.push(pro1)
  }
  else if(c === "kimi") {
    const bot2 = new BotMoonshot()
    const pro2 = bot2.run(aiParam)
    promises.push(pro2)
  }
  else if(c === "wanzhi") {
    const bot3 = new BotYi()
    const pro3 = bot3.run(aiParam)
    promises.push(pro3)
  }
  else if(c === "yuewen") {
    const bot4 = new BotStepfun()
    const pro4 = bot4.run(aiParam)
    promises.push(pro4)
  }
  else if(c === "zhipu") {
    const bot5 = new BotZhipu()
    const pro5 = bot5.run(aiParam)
    promises.push(pro5)
  }
}


/** check out if it's a directive, like "召唤..." */
class AiDirective {

  static check(
    entry: AiEntry
  ): AiDirectiveCheckRes | undefined {

    // 1. get text
    const text = entry.text
    if(!text) return

    // 2. is it a kick directive?
    const text2 = text.trim().replace("+", " ")
    const botKicked = this.isKickBot(text2)
    if(botKicked) {
      this.toKickBot(entry, botKicked)
      return { theCommand: "kick", theBot: botKicked }
    }

    // 3. is it an adding directive?
    const botAdded = this.isAddBot(text2)
    if(botAdded) {
      this.toAddBot(entry, botAdded)
      return { theCommand: "add", theBot: botAdded }
    }

    // 4. is it clear directive?
    const res4 = this.isClear(text2)
    if(res4) {
      this.toClear(entry)
      return { theCommand: "clear_history" }
    }

    // 5. is it continue directive?
    const res5 = this.isContinue(text2)
    if(res5) return res5

  }

  private static _getCommandedBot(
    prefix: string[],
    text: string,
  ) {
    const prefixMatched = prefix.find(v => text.startsWith(v))
    if(!prefixMatched) return

    const txt1 = text.substring(prefixMatched.length).trim()
    const txt2 = txt1.toLowerCase()
    const botMatched = aiBots.find(v => {
      const name = v.name.toLowerCase()
      const alias = v.alias.map(v => v.toLowerCase())
      if(name === txt2) return true
      if(alias.includes(txt2)) return true
      return false
    })

    return botMatched
  }

  private static _areTheyMatched(
    prefix: string[],
    text: string,
  ) {
    const str = text.toLowerCase()
    const list = prefix.map(v => v.toLowerCase())
    return list.includes(str)
  }

  private static isContinue(text: string): AiDirectiveCheckRes | undefined {
    const prefix = ["继续", "繼續", "Continue"]
    const res1 = this._areTheyMatched(prefix, text)
    if(res1) return { theCommand: "continue" }
    const botMatched = this._getCommandedBot(prefix, text)
    if(botMatched) {
      return { theCommand: "continue", theBot: botMatched }
    }
  }

  private static async toKickBot(entry: AiEntry, bot: AiBot) {

    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return

    // 2. find the bot in the room
    const theBot = room.characters.find(v => v === bot.character)
    if(!theBot) return

    // 3. remove the bot from the room
    const newBots = room.characters.filter(v => v !== bot.character)
    const u3: Partial<Table_AiRoom> = {
      characters: newBots,
      updatedStamp: getNowStamp(),
    }
    const rCol = db.collection("AiRoom")
    const res3 = await rCol.doc(room._id).update(u3)

    console.log("toKickBot res3: ")
    console.log(res3)

    // 4. send a message to user
    const { t } = useI18n(aiLang, { user: entry.user })
    const msg4 = t("bot_left", { botName: bot.name })
    TellUser.text(entry, msg4)

    return res3    
  }

  private static async toAddBot(entry: AiEntry, bot: AiBot) {
    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return
    const bots = room.characters

    // 2. find the bot in the room
    const theBot = bots.find(v => v === bot.character)
    if(theBot) return

    // 3. check out if the room has reached the max bots
    if(bots.length >= MAX_CHARACTERS) return

    // 4. add the bot to the room
    const newBots = [...bots, bot.character]
    const u4: Partial<Table_AiRoom> = {
      characters: newBots,
      updatedStamp: getNowStamp(),
    }
    const rCol = db.collection("AiRoom")
    const res4 = await rCol.doc(room._id).update(u4)

    // 5. send a message to user
    const msgList = ["called_1", "called_2", "called_3", "called_4"]
    const r = Math.floor(Math.random() * msgList.length)
    const msgKey = msgList[r]
    const { t } = useI18n(aiLang, { user: entry.user })
    const msg5 = t(msgKey, { botName: bot.name })
    TellUser.text(entry, msg5, bot)

    return true
  }

  private static isKickBot(text: string) {
    const prefix = ["踢掉", "踢掉", "Kick"]
    const botMatched = this._getCommandedBot(prefix, text)
    return botMatched 
  }

  private static isAddBot(text: string) {
    const prefix = ["召唤", "召喚", "Add"]
    const botMatched = this._getCommandedBot(prefix, text)
    return botMatched 
  }

  private static isClear(text: string) {
    const strs = [
      // 清空
      "清空",
      "清空上文", 
      "清空上下文",
      "清空历史", 
      "清空歷史",
      "清空历史纪录",
      "清空歷史紀錄",

      // 清除
      "清除上文", 
      "清除上下文",
      "清除历史", 
      "清除歷史",
      "清除历史纪录",
      "清除歷史紀錄",

      // 消除
      "消除上文", 
      "消除上下文",
      "消除历史", 
      "消除歷史",
      "消除历史纪录",
      "消除歷史紀錄",

      // Eng
      "Clear chat",
      "Clear history",
      "Clear context",
    ]
    const res = this._areTheyMatched(strs, text)
    return res
  }

  private static async toClear(entry: AiEntry) {
    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return false

    // 2. add a clear record into db
    const b2 = getBasicStampWhileAdding()
    const data2: Partial_Id<Table_AiChat> = {
      ...b2,
      sortStamp: b2.insertedStamp,
      infoType: "clear",
      roomId: room._id,
    }
    const col = db.collection("AiChat")
    const res2 = await col.add(data2)
    console.log("toClear res2: ")
    console.log(res2)

    // 3. send a cleared message to user
    const { t } = useI18n(aiLang, { user: entry.user })
    TellUser.text(entry, t("history_cleared"))

    return true
  }

}



/**************************** Bots ***************************/

class BaseLLM {
  protected _client: OpenAI | undefined
  protected _baseUrl: string | undefined
  constructor(apiKey?: string, baseURL?: string) {
    this._baseUrl = baseURL
    try {
      this._client = new OpenAI({ apiKey, baseURL })
    }
    catch(err) {
      console.warn("BaseLLM constructor gets client error: ")
      console.log(err)
    }
  }

  private _tryTimes = 0

  public async chat(
    params: OpenAI.Chat.ChatCompletionCreateParams
  ): Promise<OaiChatCompletion | undefined> {
    const _this = this
    const client = _this._client
    if(!client) return

    _this._tryTimes++

    try {
      const chatCompletion = await client.chat.completions.create(params)
      return chatCompletion as OaiChatCompletion
    }
    catch(err) {
      console.warn("BaseLLM chat error: ")
      console.log(err)
      console.log(`current baseURL: `, client.baseURL)
      console.log(`current model: `, params.model)

      let isRateLimit = false
      const errType = typeof err
      const errMsg = errType === "string" ? err : err?.toString?.()
      console.log("errMsg: ")
      console.log(errMsg)
      
      if(typeof errMsg === "string") {
        console.log("errMsg is string!")

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
        
      }

      if(_this._tryTimes < 3 && isRateLimit) {
        console.log("getting to try again!")
        await valTool.waitMilli(1000)
        const triedRes = await _this.chat(params)
        return triedRes
      }
    }
  }
}

class BaseBot {
  protected _character: AiCharacter
  protected _bots: AiBot[]

  constructor(c: AiCharacter) {
    this._character = c
    this._bots = aiBots.filter(v => v.character === c)
  }

  protected async chat(
    params: OpenAI.Chat.ChatCompletionCreateParams,
    bot: AiBot,
  ) {

    const apiData = AiHelper.getApiEndpointFromBot(bot)
    if(!apiData) {
      console.warn(`no api data for ${this._character}`)
      console.log(bot)
      return
    }

    const llm = new BaseLLM(apiData.apiKey, apiData.baseURL)
    const t1 = getNowStamp()
    const res = await llm.chat(params)
    const t2 = getNowStamp()
    const cost = t2 - t1

    const c = this._character
    console.log(`${c} chat cost: ${cost}ms`)
    if(!res) {
      console.warn(`${c} chat got an error`)
    }

    return res
  }

  private _getBotAndChats(param: AiRunParam) {
    // 1. get params
    let { chats } = param
    const _this = this
    let bots = [..._this._bots]

    // 2. filter bots for image_to_text
    const needImageToText = AiHelper.needImageToTextAbility(chats)
    if(needImageToText) {
      bots = bots.filter(v => v.abilities.includes("image_to_text"))
      if(bots.length < 1) {

        // 3. try to compress chats for images
        const newChats = AiHelper.compressChats(chats)
        if(!newChats) {
          const { t } = useI18n(aiLang, { user: param.entry.user })
          const msg3 = t("cannot_read_images")
          TellUser.text(param.entry, msg3, undefined, _this._character)
          return
        }

        bots = [..._this._bots]
        chats = newChats
      }
    }
    
    return { bot: bots[0], chats }
  }

  private _clipChats(
    bot: AiBot,
    chats: Table_AiChat[],
    user: Table_User,
  ) {
    const cLength = chats.length
    if(cLength < 2) return chats

    // 1. get windowTokens
    const isSubscribed = checkIfUserSubscribed(user)
    const _MAX_TOKEN = isSubscribed ? 32000 : 16000
    const { maxWindowTokenK } = bot
    let windowTokens = 1000 * maxWindowTokenK
    if(windowTokens > _MAX_TOKEN) {
      windowTokens = _MAX_TOKEN
    }

    // 2. calculate reachedTokens
    let reservedToken = Math.floor(windowTokens * 0.1)
    if(reservedToken < MIN_RESERVED_TOKENS) {
      reservedToken = MIN_RESERVED_TOKENS
    }
    const reachedTokens = windowTokens - reservedToken

    // 3. to clip
    let token = 0
    for(let i=0; i<cLength; i++) {
      const v = chats[i]
      token += AiHelper.calculateChatToken(v)
      if(token > reachedTokens) {
        chats = chats.slice(0, i)
        break
      }
    }

    return chats
  }

  protected preRun(param: AiRunParam): PreRunResult | undefined {
    // 1. get bot
    const botAndChats = this._getBotAndChats(param)
    if(!botAndChats) return
    let { bot, chats } = botAndChats

    // 2. clip chats
    const { entry } = param
    const { user } = entry
    chats = this._clipChats(bot, chats, user)

    // 3. get prompts and add system prompt
    const prompts = AiHelper.turnChatsIntoPrompt(
      chats,
      user,
      { abilities: bot.abilities },
    )

    // 4. handle current date & time 
    // then add system prompt
    const { 
      date: current_date, 
      time: current_time,
    } = LiuDateUtil.getDateAndTime(getNowStamp(), user.timezone)
    const { p } = aiI18nChannel({ entry, character: bot.character })
    const system_1 = p("system_1", { current_date, current_time })
    const system_1_token = AiHelper.calculateTextToken(system_1)
    if(system_1) {
      prompts.push({ role: "system", content: system_1 })
    }

    // 5. reverse prompts
    prompts.reverse()

    // 6. calculate total token
    let totalToken = 0
    chats.forEach(v => {
      totalToken += AiHelper.calculateChatToken(v)
    })
    totalToken += system_1_token


    // 7. construct result of preRun
    const res7: PreRunResult = { prompts, totalToken, bot, chats }

    // 8. tools
    if(bot.abilities.includes("tool_use")) {
      const tools = valTool.copyObject(aiTools)
      res7.tools = tools
    }


    // console.warn(`see ${bot.character} prompts: `)
    // console.log(prompts)

    return res7
  }

  private async _handleToolUse(
    postParam: PostRunParam,
    tool_calls: OaiToolCall[],
  ) {
    const { aiParam, bot, chatCompletion } = postParam
    const toolHandler = new ToolHandler(
      aiParam, 
      bot,
      tool_calls,
      chatCompletion,
    )

    if(chatCompletion) {
      const text = AiHelper.getTextFromLLM(chatCompletion, bot)
      if(text) {
        console.warn("_handleToolUse text 存在，先暂停！")
        console.log(text)
        return
      }
    }

    for(let i=0; i<tool_calls.length; i++) {
      const v = tool_calls[i]
      const funcData = v["function"]

      if(v.type !== "function" || !funcData) continue

      const funcName = funcData.name
      const funcArgs = funcData.arguments
      const funcJson = valTool.strToObj(funcArgs)

      console.log("funcName: ", funcName)
      console.log(funcJson)

      if(funcName === "add_note") {
        await toolHandler.add_note(funcJson)
      }
      else if(funcName === "add_todo") {
        await toolHandler.add_todo(funcJson)
      }
      else if(funcName === "add_calendar") {
        await toolHandler.add_calendar(funcJson)
      }
      else if(funcName === "web_search") {
        let searchRes = await toolHandler.web_search(funcJson)
        if(searchRes) {
          this._continueAfterWebSearch(postParam, tool_calls, searchRes)
          break
        }
      }

    }
  }

  private _getRestTokensAndPrompts(
    postParam: PostRunParam,
  ) {
    const { chatParam, chatCompletion } = postParam
    const usage = chatCompletion?.usage
    if(!usage) return
    const usedTokens = usage.total_tokens
    const { messages } = chatParam
    let prompts = [...messages]
    const maxWindowTokens = postParam.bot.maxWindowTokenK * 1000
    let restTokens = maxWindowTokens - usedTokens
    if(restTokens < 1) return
    const mLength = messages.length
    if(mLength < 2) return
    if(mLength > 5) {
      const systemPrompt = messages[0]
      const tempPrompts = messages.slice(mLength - 3)
      prompts = [systemPrompt, ...tempPrompts]
    }
    return { restTokens, prompts }
  }

  private async _continueAfterWebSearch(
    postParam: PostRunParam,
    tool_calls: OaiToolCall[],
    searchRes: LiuAi.SearchResult,
  ) {
    // 1. handle max tokens
    const tool_call_id = tool_calls[0]?.id
    if(!tool_call_id) return
    const data1 = this._getRestTokensAndPrompts(postParam)
    if(!data1) return
    let { restTokens, prompts } = data1
    const searchMarkdown = searchRes.markdown
    const token1 = AiHelper.calculateTextToken(searchMarkdown)
    restTokens -= token1
    if(restTokens > MAX_WX_TOKEN) {
      restTokens = MAX_WX_TOKEN
    }
    if(restTokens < MIN_REST_TOKEN) {
      if(prompts.length > 3) {
        restTokens = MAX_WX_TOKEN
        prompts.splice(0, prompts.length - 3)
      }
      else {
        console.warn("not enough rest tokens in _continueAfterWebSearch!")
        return
      }
    }

    // 2. add "assistant" message to prompts
    const c = this._character
    prompts.push({ role: "assistant", tool_calls, name: c })

    // 3. add "tool" message to prompts
    prompts.push({
      role: "tool",
      content: searchMarkdown,
      tool_call_id,
    })

    console.warn("see prompts in _continueAfterWebSearch: ")
    if(prompts.length < 5) {
      console.log(prompts)
    }
    else {
      const pLength = prompts.length
      const p1 = prompts[pLength - 3]
      const p2 = prompts[pLength - 2]
      const p3 = prompts[pLength - 1]
      console.log([p1, p2, p3])
    }

    // 4. new chat create param
    const { chatParam, bot, aiParam, chatCompletion } = postParam
    const newChatParam: OaiCreateParam = { 
      ...chatParam,
      messages: prompts,
      max_tokens: restTokens,
    }
    const res4 = await this.chat(newChatParam, bot)
    if(!res4) return

    // 5. can i reply
    const res5 = await AiHelper.canReply(aiParam)
    if(!res5) return

    // 6. handle text from response
    const assistantChatId = await this._handleAssistantText(res4, aiParam, bot)
    if(!assistantChatId) return

    return {
      character: c,
      replyStatus: "yes",
      chatCompletion, 
      assistantChatId,
    }
  }

  private async _autoContinue(
    postParam: PostRunParam,
    msgFromAssistant: OaiMessage,
  ) {
    // 1. handle max tokens
    const data1 = this._getRestTokensAndPrompts(postParam)
    if(!data1) return
    let { restTokens, prompts } = data1
    const { chatParam, chatCompletion, bot, aiParam } = postParam
    if(restTokens > MAX_WX_TOKEN) {
      restTokens = MAX_WX_TOKEN
    }

    // 2. add "latest message from assistant"
    // and "Continue" if needed
    const c = bot.character
    prompts.push(msgFromAssistant)
    if(c === "wanzhi") {
      prompts.push({ role: "user", content: "继续 / Continue" })
    }
    console.log("restTokens in continue: ", restTokens)

    // 3. new chat create param
    const newChatParam: OaiCreateParam = { 
      ...chatParam,
      messages: prompts,
      max_tokens: restTokens,
    }
    const res3 = await this.chat(newChatParam, bot)
    if(!res3) return

    console.log("see usage in continue......")
    console.log(res3.usage)

    // 4. can i reply
    const res4 = await AiHelper.canReply(aiParam)
    if(!res4) return
    
    // 5. handle text from response
    const assistantChatId = await this._handleAssistantText(res3, aiParam, bot)
    if(!assistantChatId) return

    return { 
      character: c,
      replyStatus: "yes",
      chatCompletion, 
      assistantChatId,
    }
  }

  private async _handleAssistantText(
    chatCompletion: OaiChatCompletion,
    aiParam: AiRunParam,
    bot: AiBot,
  ) {
    const roomId = aiParam.room._id
    const c = bot.character

    // 1. get text
    const txt6 = AiHelper.getTextFromLLM(chatCompletion, bot)
    if(!txt6) return

    console.log(`${c} assistant text.length: ${txt6.length}`)

    // 2. reply to user
    TellUser.text(aiParam.entry, txt6, bot)
    
    // 3. add assistant chat
    const apiEndpoint = AiHelper.getApiEndpointFromBot(bot)
    const param9: AiHelperAssistantMsgParam = {
      roomId,
      text: txt6,
      model: bot.model,
      character: c,
      usage: chatCompletion.usage,
      requestId: chatCompletion.id,
      baseUrl: apiEndpoint?.baseURL,
      finish_reason: AiHelper.getFinishReason(chatCompletion),
    }
    const assistantChatId = await AiHelper.addAssistantMsg(param9)
    if(!assistantChatId) return

    return assistantChatId
  }

  protected async postRun(postParam: PostRunParam): Promise<AiRunSuccess | undefined> {
    // 1. get params
    const { bot, chatCompletion, aiParam } = postParam
    if(!chatCompletion) return
    const c = bot.character
    const firstChoice = chatCompletion.choices[0]
    if(!firstChoice) {
      console.warn(`${c} no choice!`)
      return
    }
    const { finish_reason, message } = firstChoice
    if(!message) return
    const { tool_calls } = message

    console.warn(`${c} finish reason: ${finish_reason}`)
    console.log(`usage: `)
    console.log(chatCompletion.usage)
    
    // 2. can i reply
    const res2 = await AiHelper.canReply(aiParam, bot)
    if(!res2) {
      return {
        character: c,
        replyStatus: "has_new_msg",
        chatCompletion,
      }
    }

    console.log(`${c} can reply! see message: `)
    console.log(chatCompletion.choices[0].message)

    // 3. tool calls
    if(finish_reason === "tool_calls" && tool_calls) {
      this._handleToolUse(postParam, tool_calls)
    }
    
    // 4. finish reason is "length"
    if(finish_reason === "length" && !aiParam.isContinueCommand) {
      // this._autoContinue(postParam, message)
    }

    // 5. finish reason is "content_filter"
    if(finish_reason === "content_filter") {
      console.warn(`${c} content filter!`)
    }

    // 6. otherwise, handle text
    const assistantChatId = await this._handleAssistantText(chatCompletion, aiParam, bot)
    
    return { 
      character: c,
      replyStatus: "yes",
      chatCompletion, 
      assistantChatId,
    }
  }

}

class BotDeepSeek extends BaseBot {

  constructor() {
    super("deepseek")
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}

class BotMoonshot extends BaseBot {

  constructor() {
    super("kimi")
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}

class BotStepfun extends BaseBot {

  constructor() {
    super("yuewen")
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}

class BotYi extends BaseBot {

  constructor() {
    super("wanzhi")
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things
    if(aiParam.isContinueCommand) {
      prompts.push({ role: "user", content: "Continue / 继续" })
    }

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}

class BotZhipu extends BaseBot {

  constructor() {
    super("zhipu")
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things
    // 3.1 remove web_search and parse_link, and add its own web_search
    if(tools && bot.metaData?.zhipuWebSearch) {
      AiHelper.removeOneTool("web_search", tools)
      AiHelper.removeOneTool("parse_link", tools)
      
      // see https://bigmodel.cn/dev/howuse/websearch
      const webSearchTool = {
        type: "web_search",
        web_search: {
          enable: true,
          search_result: true,
        }
      }
      tools.splice(0, 0, webSearchTool as any)
    }

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}


/*********************** AI Controller ************************/
class AiController {

  async run(aiParam: AiRunParam) {
    const { room, entry } = aiParam

    // 1. check bots in the room
    let characters = room.characters
    const newCharacters = characters.filter(c => AiHelper.isCharacterAvailable(c))
    if(newCharacters.length < 1) {
      console.warn("no available characters in the room")
      return false
    }

    // 2. compress chats
    const needCompress = AiCompressor.doINeedCompress(aiParam.chats)
    if(needCompress) {
      console.log("get to compress..............")
      const newChats = await AiCompressor.run(aiParam)
      if(newChats) {
        aiParam.chats = newChats
      }
      const res2 = await AiHelper.canReply(aiParam)
      if(!res2) {
        console.warn("we don't need to reply because ")
        console.log("there is a new message after compressing")
        return
      }
    }

    // 3. get promises
    const promises: Promise<AiRunSuccess | undefined>[] = []
    for(let i=0; i<newCharacters.length; i++) {
      const c = newCharacters[i]
      const _chats = valTool.copyObject(aiParam.chats)
      const newParam: AiRunParam = { 
        ...aiParam,
        chats: _chats,
      }
      mapBots(c, newParam, promises)
    }
    if(promises.length < 1) return

    // 3.1 send "typing" state
    TellUser.typing(entry)

    // 4. wait for all promises
    const res4 = await Promise.all(promises)
    let hasEverSucceeded = false
    for(let i=0; i<res4.length; i++) {
      const v = res4[i]
      if(v && v.replyStatus === "yes") {
        hasEverSucceeded = true
      }
    }
    if(!hasEverSucceeded) return

    // 5. add quota for user
    const num5 = AiHelper.addQuotaForUser(entry)
    if((num5 % 3) === 2) {
      this.sendFallbackMenu(aiParam, res4)
    }

  }

  private async sendFallbackMenu(
    aiParam: AiRunParam,
    results: AiRunResults,
  ) {
    const { entry, room } = aiParam
    const user = entry.user
    const { t } = useI18n(aiLang, { user })
    const characters = room.characters
    let prefixMessage = ""
    let suffixMessage = ""

    // 1. get kickList & addedList
    const kickList = AiHelper.getKickCharacters(characters, results)
    const addedList = AiHelper.getAddedCharacters(characters, results)

    // 2. privacy tips

    // 3. menu
    const menuList: AiMenuItem[] = []
    kickList.forEach(v => menuList.push({ operation: "kick", character: v }))
    addedList.forEach(v => menuList.push({ operation: "add", character: v }))
    menuList.push({ operation: "clear_history" })
    if(menuList.length > 0) {
      prefixMessage += t("operation_title")
      suffixMessage = "\n"
    }

    // 4. add warning into suffixMessage
    suffixMessage += t("generative_ai_warning")

    console.warn("ready to send menu........")
    console.log(prefixMessage)
    console.log(menuList)
    console.log(suffixMessage)

    // 5. send
    TellUser.menu(entry, prefixMessage, menuList, suffixMessage)
  }

}

/*********************** Contine by Human ************************/

interface ContinueTmpItem {
  character: AiCharacter
  chats: Table_AiChat[]
}

class ContinueController {

  private _entry: AiEntry
  private _room: Table_AiRoom
  private _characterSelected?: AiCharacter

  constructor(
    entry: AiEntry, 
    room: Table_AiRoom,
    characterSelected?: AiCharacter
  ) {
    this._entry = entry
    this._room = room
    this._characterSelected = characterSelected
  }

  async run() {
    const room = this._room
    const roomId = room._id
    const entry = this._entry
    const characterSelected = this._characterSelected

    // 1. get latest 16 chats
    const chats = await AiHelper.getLatestChat(roomId, 16)
    if(chats.length < 2) return

    // 1.1 generate a chat list where the first one is the user message, and the rest is messages before that
    let chatsBeforeUser: Table_AiChat[] = []
    let userAndTheRest: Table_AiChat[] = []
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      if(v.infoType === "user") {
        chatsBeforeUser = chats.slice(0, i)
        userAndTheRest = chats.slice(i)
        break
      }
    }
    if(chatsBeforeUser.length < 1) return
    if(userAndTheRest.length < 1) return

    // 2. find characters and their chats to continue
    const stoppedCharacters: AiCharacter[] = []
    const list: ContinueTmpItem[] = []
    for(let i=0; i<chatsBeforeUser.length; i++) {
      const v = chatsBeforeUser[i]
      const { infoType, character, finish_reason } = v

      // 2.1 next if infoType is not assistant or character is undefined
      if(infoType !== "assistant" || !character) continue

      // 2.2 check out if it's the selected character
      if(characterSelected) {
        if(character !== characterSelected) continue
      }

      // 2.3 next if character is stopped
      const isStopped = stoppedCharacters.includes(character)
      if(isStopped) continue

      // 2.4 add character into stoppedCharacters if finish_reason is stop
      if(finish_reason === "stop") {
        stoppedCharacters.push(character)
        continue
      }

      // 2.5 next if finish_reason is not "length"
      if(finish_reason !== "length") continue
      
      // 2.6 add the chat
      const v2 = list.find(v3 => v3.character === character)
      if(v2) {
        v2.chats.push(v)
        continue
      }
      list.push({ character, chats: [v] })
    }

    // 3. return if list is empty
    if(list.length < 1) {
      const { t } = useI18n(aiLang, { user: entry.user })
      const msg3 = t("no_more_to_continue")
      TellUser.text(entry, msg3)
      return
    }
    list.forEach(v => {
      const copyOfUserAndTheRest = valTool.copyObject(userAndTheRest)
      v.chats.push(...copyOfUserAndTheRest)
    })

    // 4. get promises
    const promises: Promise<AiRunSuccess | undefined>[] = []
    for(let i=0; i<list.length; i++) {
      const v = list[i]
      const c = v.character
      const newParam: AiRunParam = {
        entry,
        room,
        chats: v.chats,
        isContinueCommand: true,
      }
      mapBots(c, newParam, promises)
    }
    if(promises.length < 1) return

    // 3.1 send "typing" state
    TellUser.typing(entry)

    // 4. wait for all promises
    const res4 = await Promise.all(promises)
    let hasEverSucceeded = false
    for(let i=0; i<res4.length; i++) {
      const v = res4[i]
      if(v && v.replyStatus === "yes") {
        hasEverSucceeded = true
      }
    }
    if(!hasEverSucceeded) return

    // 5. add quota for user
    AiHelper.addQuotaForUser(entry)
  }

}



/*********************** AI Compressor ************************/
class AiCompressor {

  static doINeedCompress(chats: Table_AiChat[]) {
    const len = chats.length
    if(len < 3) return false
    
    let token = 0
    for(let i=0; i<len; i++) {
      const v = chats[i]
      token += AiHelper.calculateChatToken(v)
      if(v.infoType === "summary") break
    }

    console.log("do i need compress: ", token)

    if(token > TOKEN_NEED_COMPRESS) return true
    return false
  }


  static async run(
    aiParam: AiRunParam,
  ): Promise<Table_AiChat[] | undefined> {
    const _env = process.env
    const { chats, entry, room } = aiParam
    const { user } = entry

    // 1. get the two system prompts
    const { p } = aiI18nShared({ type: "compress", user })
    const system1 = p("system_1")
    const system2 = p("system_2")

    // 2. add two system prompts to the prompts
    const prompts = AiHelper.turnChatsIntoPrompt(chats, user)
    prompts.reverse()
    prompts.unshift({ role: "system", content: system1 })
    prompts.push({ role: "user", content: system2 })

    // 3. add prefix msg
    const prefix_msg = p("prefix_msg")
    if(_env.LIU_SUMMARY_PREFIX === "01") {
      const msg3_1 = { 
        role: "assistant", 
        content: prefix_msg, 
        prefix: true,
      } as OaiPrompt
      prompts.push(msg3_1)
    }
    else if(_env.LIU_SUMMARY_PARTIAL === "01") {
      const msg3_2 = { 
        role: "assistant", 
        content: prefix_msg, 
        partial: true,
      } as OaiPrompt
      prompts.push(msg3_2)
    }

    // 4. construct the arg to send to LLM
    const llm = new BaseLLM(_env.LIU_SUMMARY_API_KEY, _env.LIU_SUMMARY_BASE_URL)
    const arg4: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      model: _env.LIU_SUMMARY_MODEL ?? "",
    }
    const t1 = getNowStamp()
    const res4 = await llm.chat(arg4)
    const t2 = getNowStamp()
    const cost = t2 - t1
    console.log("summary cost: ", cost)
    if(!res4) {
      console.warn("summary llm got an error")
      return
    }

    console.log("see summary response......")
    console.log(res4.choices[0])
    // 5. get data from the response
    const usage = res4.usage
    const text = res4.choices[0].message.content
    if(!text) {
      console.warn("no text in the summary response")
      return
    }

    // 6. calculate the new total token and get the sortStamp
    let totalToken = 0
    let idx6 = 0
    const newChats: Table_AiChat[] = []
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      const token = AiHelper.calculateChatToken(v)
      totalToken += token
      newChats.push(v)
      idx6 = i
      if(totalToken > 900) {
        break
      }
    }
    if(usage?.completion_tokens) {
      totalToken += usage.completion_tokens
    }
    const sortStamp = chats[idx6]?.sortStamp ?? getNowStamp()
    const newSortStamp = sortStamp - 10

    // 7. storage the summary
    const b7 = getBasicStampWhileAdding()
    const data7: Partial_Id<Table_AiChat> = {
      ...b7,
      sortStamp: newSortStamp,
      roomId: room._id,
      infoType: "summary",
      text,
      model: _env.LIU_SUMMARY_MODEL,
      usage,
      requestId: res4.id,
      baseUrl: _env.LIU_SUMMARY_BASE_URL,
    }
    const chatId7 = await AiHelper.addChat(data7)
    if(!chatId7) return
    newChats.push({ _id: chatId7, ...data7 })

    // 8. return the new chats
    return newChats
  }
}


/*********************** helper functions ************************/


class ToolHandler {

  private _aiParam: AiRunParam
  private _bot: AiBot
  private _tool_calls: OaiToolCall[]
  private _chatCompletion?: OaiChatCompletion

  constructor(
    aiParam: AiRunParam, 
    bot: AiBot,
    tool_calls: OaiToolCall[],
    chatCompletion?: OaiChatCompletion,
  ) {
    this._aiParam = aiParam
    this._bot = bot
    this._tool_calls = tool_calls
    this._chatCompletion = chatCompletion
  }

  private async _addMsgToChat(
    param: Partial<AiHelperAssistantMsgParam>
  ) {
    const { room } = this._aiParam
    const bot = this._bot
    const chatCompletion = this._chatCompletion
    const apiEndpoint = AiHelper.getApiEndpointFromBot(bot)
    const arg: AiHelperAssistantMsgParam = {
      roomId: room._id,
      model: bot.model,
      character: bot.character,
      usage: chatCompletion?.usage,
      requestId: chatCompletion?.id,
      baseUrl: apiEndpoint?.baseURL,
      tool_calls: this._tool_calls,
      ...param,
    }
    const assistantChatId = await AiHelper.addAssistantMsg(arg)

    console.log("_addMsgToChat assistantChatId: ", assistantChatId)

    return assistantChatId
  }

  private _getAgreeAndEditLinks(assistantChatId: string) {
    const domain = getLiuDoman()

    // WIP: agree page / compose page
    const agreeLink = `${domain}/agree?chatId=${assistantChatId}`
    const editLink = `${domain}/compose?chatId=${assistantChatId}`

    return { agreeLink, editLink }
  }

  private _getEssentialReplyData(assistantChatId: string) {
    const entry = this._aiParam.entry
    const { user } = entry
    const { t } = useI18n(aiLang, { user })
    const { agreeLink, editLink } = this._getAgreeAndEditLinks(assistantChatId)
    const botName = this._bot.name
    return { t, agreeLink, editLink, botName }
  }
  
  async add_note(funcJson: Record<string, any>) {
    // 1. check out param
    const waitingData = AiToolUtil.turnJsonToWaitingData("add_note", funcJson)
    if(!waitingData) {
      console.warn("cannot parse funcJson in add_note: ")
      console.log(funcJson)
      return
    }

    // 2. add msg
    const assistantChatId = await this._addMsgToChat({
      funcName: "add_note",
      funcJson,
    })
    if(!assistantChatId) return

    // 3. reply
    const { t, agreeLink, editLink, botName } = this._getEssentialReplyData(assistantChatId)
    let msg = ""
    const { title, description } = funcJson
    if(title) {
      msg = t("add_note_with_title", { botName, title, desc: description, agreeLink, editLink })
    }
    else {
      msg = t("add_note_only_desc", { botName, desc: description, agreeLink, editLink })
    }
    TellUser.text(this._aiParam.entry, msg)
  }

  async add_todo(funcJson: Record<string, any>) {
    // 1. check out param
    const waitingData = AiToolUtil.turnJsonToWaitingData("add_todo", funcJson)
    if(!waitingData) {
      console.warn("cannot parse funcJson in add_todo: ")
      console.log(funcJson)
      return
    }

    // 2. add msg
    const assistantChatId = await this._addMsgToChat({
      funcName: "add_todo",
      funcJson,
    })
    if(!assistantChatId) return

    // 3. reply
    const { t, agreeLink, editLink, botName } = this._getEssentialReplyData(assistantChatId)
    const { title } = funcJson
    let msg = t("add_todo", { botName, title, agreeLink, editLink })
    TellUser.text(this._aiParam.entry, msg)
  }

  async add_calendar(funcJson: Record<string, any>) {
    // 1. check out param
    const waitingData = AiToolUtil.turnJsonToWaitingData("add_calendar", funcJson)
    if(!waitingData) {
      console.warn("cannot parse funcJson in add_calendar: ")
      console.log(funcJson)
      return
    }

    // 2. add msg
    const assistantChatId = await this._addMsgToChat({
      funcName: "add_calendar",
      funcJson,
    })
    if(!assistantChatId) return

    // 3. reply
    const { t, agreeLink, editLink, botName } = this._getEssentialReplyData(assistantChatId)
    const {
      title,
      description,
      date,
      specificDate,
      time,
      earlyMinute,
      laterHour,
    } = funcJson as AiToolAddCalendarParam
    let msg = t("add_calendar_1", { botName })
    if(title) {
      msg += t("add_calendar_2", { title })
    }
    msg += t("add_calendar_3", { desc: description })

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

    // 3.3 add footer
    msg += t("add_calendar_7", { agreeLink, editLink })

    console.warn("see msg for calendar: ")
    console.log(msg)

    TellUser.text(this._aiParam.entry, msg)
  }

  async web_search(funcJson: Record<string, any>) {
    console.warn("web_search by ourselves!")
    console.log(funcJson)

    // 1. get q
    const q = funcJson.q
    if(typeof q !== "string") {
      console.warn("web_search q is not string")
      return
    }

    // 2. call WebSearch.run
    const searchRes = await WebSearch.run(q)
    if(!searchRes) {
      console.warn("fail to search on web")
      return
    }

    // 3. add msg
    const data3: Partial<AiHelperAssistantMsgParam> = {
      funcName: "web_search",
      funcJson,
      webSearchProvider: searchRes.provider,
      webSearchData: searchRes.originalResult,
      text: searchRes.markdown,
    }
    const assistantChatId = await this._addMsgToChat(data3)
    return searchRes
  }


  async get_schedule(funcJson: Record<string, any>) {
    // 1. checking out param
    const res1 = vbot.safeParse(Sch_AiToolGetScheduleParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse get_schedule param: ")
      console.log(funcJson)
      console.log(res1.issues)
      return
    }
    const { hoursFromNow, specificDate } = funcJson
    if(!hoursFromNow && !specificDate) {
      console.warn("hoursFromNow or specificDate is required")
      return
    }

    // WIP

  }

  async get_cards(funcJson: Record<string, any>) {
    const res1 = vbot.safeParse(Sch_AiToolGetCardsParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse get_cards param: ")
      console.log(funcJson)
      console.log(res1.issues)
      return
    }
    const cardType = funcJson.cardType as AiToolGetCardType

    // WIP


  }

}


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
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
    }
    const messages = [{ role: "user", content: q }]
    const body = {
      tool: "web-search-pro",
      messages,
      stream: false,
    }
    try {
      const res = await liuReq<ZhipuBigModel.WebSearchChatCompletion>(
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
    chatCompletion: ZhipuBigModel.WebSearchChatCompletion,
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
    for(const r of results) {
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


class AiHelper {

  static async getMyAiRoom(
    entry: AiEntry,
  ) {
    // 1. get room
    const userId = entry.user._id
    const rCol = db.collection("AiRoom")
    const res1 = await rCol.where({ owner: userId }).getOne<Table_AiRoom>()
    const room = res1.data
    if(room) return room
  
    // 2. create room
    const b2 = getBasicStampWhileAdding()
    const characters = this.fillCharacters()
    console.log("init characters: ")
    console.log(characters)
    const room2: Partial_Id<Table_AiRoom> = {
      ...b2,
      owner: userId,
      characters,
    }
    const res2 = await rCol.add(room2)
    const roomId = getDocAddId(res2)
    if(!roomId) {
      console.warn("cannot get roomId while creating ai room error")
      console.log(res2)
      console.log("entry: ")
      console.log(entry)
      return
    }
  
    // 3. return room
    const newRoom: Table_AiRoom = { _id: roomId, ...room2 }
    return newRoom
  }

  private static fillCharacters() {
    const all_characters = this.getAvailableCharacters()
    if(all_characters.length <= MAX_CHARACTERS) {
      return all_characters
    }

    const my_characters: AiCharacter[] = []
    for(let i=0; i<MAX_CHARACTERS; i++) {
      const r = Math.floor(Math.random() * all_characters.length)
      const c = all_characters[r]
      my_characters.push(c)
      all_characters.splice(r, 1)
    }

    return my_characters
  }

  static getApiEndpointFromBot(bot: AiBot) {
    const _env = process.env
    const p = bot.provider
    const p2 = bot.secondaryProvider

    let apiKey: string | undefined
    let baseURL: string | undefined

    // If secondaryProvider exists, use it first
    if(p2 === "siliconflow") {
      apiKey = _env.LIU_SILICONFLOW_API_KEY
      baseURL = _env.LIU_SILICONFLOW_BASE_URL
    }
    else if(p === "zhipu") {
      apiKey = _env.LIU_ZHIPU_API_KEY
      baseURL = _env.LIU_ZHIPU_BASE_URL
    }
    else if(p === "moonshot") {
      apiKey = _env.LIU_MOONSHOT_API_KEY
      baseURL = _env.LIU_MOONSHOT_BASE_URL
    }
    else if(p === "deepseek") {
      apiKey = _env.LIU_DEEPSEEK_API_KEY
      baseURL = _env.LIU_DEEPSEEK_BASE_URL
    }
    else if(p === "stepfun") {
      apiKey = _env.LIU_STEPFUN_API_KEY
      baseURL = _env.LIU_STEPFUN_BASE_URL
    }
    else if(p === "zero-one") {
      apiKey = _env.LIU_YI_API_KEY
      baseURL = _env.LIU_YI_BASE_URL
    }
    
    if(apiKey && baseURL) {
      return { apiKey, baseURL }
    }
  }

  private static getAvailableCharacters() {
    const characters: AiCharacter[] = []
    for(let i=0; i<aiBots.length; i++) {
      const bot = aiBots[i]
      const c = bot.character
      if(characters.includes(c)) continue

      const apiData = this.getApiEndpointFromBot(bot)
      if(apiData) {
        characters.push(c)
      }
    }

    return characters
  }


  static async checkQuota(
    entry: AiEntry,
  ) {
    const user = entry.user
    const quota = user.quota
    if(!quota) return true

    const count = quota.aiConversationCount
    const isSubscribed = checkIfUserSubscribed(user)
    const MAX_TIMES = isSubscribed ? MAX_TIMES_MEMBERSHIP : MAX_TIMES_FREE

    const available = count < MAX_TIMES
    if(!available) {
      if(MAX_TIMES === MAX_TIMES_FREE) {
        UserHelper.sendQuotaWarning(entry)
      }
      else {
        UserHelper.sendQuotaWarning2(entry)
      }
    }

    return available
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

  static async addUserMsg(
    entry: AiEntry,
    roomId: string,
  ) {
    const userId = entry.user._id
    const { 
      msg_type,
      text, 
      image_url, 
      file_base64,
      wx_gzh_openid,
      wx_media_id,
      wx_media_id_16k,
    } = entry
    const b1 = getBasicStampWhileAdding()
    const data1: Partial_Id<Table_AiChat> = {
      ...b1,
      sortStamp: b1.insertedStamp,
      roomId,
      infoType: "user",
      msgType: msg_type,
      text,
      imageUrl: image_url,
      fileBase64: file_base64,
      wxMediaId: wx_media_id,
      wxMediaId16K: wx_media_id_16k,
      userId,
    }
    if(wx_gzh_openid) {
      data1.channel = "wx_gzh"
    }

    const chatId = await this.addChat(data1)
    return chatId
  }

  static async addAssistantMsg(
    param: AiHelperAssistantMsgParam,
  ) {
    const b1 = getBasicStampWhileAdding()
    const data1: Partial_Id<Table_AiChat> = {
      ...b1,
      sortStamp: b1.insertedStamp,
      roomId: param.roomId,
      infoType: param.funcName ? "tool_use" : "assistant",
      text: param.text,
      model: param.model,
      character: param.character,
      usage: param.usage,
      requestId: param.requestId,
      baseUrl: param.baseUrl,
      funcName: param.funcName,
      funcJson: param.funcJson,
      tool_calls: param.tool_calls,
      finish_reason: param.finish_reason,
      webSearchProvider: param.webSearchProvider,
      webSearchData: param.webSearchData,
    }
    const chatId = await this.addChat(data1)
    return chatId
  }

  static async getLatestChat(
    roomId: string,
    limit: number = 50,
  ): Promise<Table_AiChat[]> {
    const col = db.collection("AiChat")
    const q1 = col.where({ roomId }).orderBy("sortStamp", "desc")
    const res1 = await q1.limit(limit).get<Table_AiChat>()
    const results = res1.data
    const chats: Table_AiChat[] = []
    let imageNum = 0

    for(let i=0; i<results.length; i++) {
      const v = results[i]
      if(v.infoType === "clear") {
        break
      }

      // turn image to [image]
      if(v.msgType === "image") {
        imageNum++

        if(imageNum > 3 || i > 9) {
          v.msgType = "text"
          v.text = "[image]"
          delete v.imageUrl
        }
      }

      chats.push(v)
    }

    return chats
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
    return token
  }

  static calculateChatToken(
    chat: Table_AiChat,
  ) {
    const { infoType, usage, text, imageUrl, msgType } = chat
    if(infoType === "assistant" || infoType === "summary") {
      const token1 = usage?.completion_tokens
      if(token1) return token1
    }

    let token = 0
    if(text) {
      token = this.calculateTextToken(text)
    }
    else if(imageUrl) {
      token += 600
    }

    if(msgType === "voice") {
      token += 400
    }

    return token
  }

  // @param bot is required if isContinueCommand is true
  static async canReply(
    aiParam: AiRunParam,
    bot?: AiBot,
  ) {
    const { room, chatId, isContinueCommand } = aiParam
    const roomId = room._id
    const col = db.collection("AiChat")
    const q1 = col.where({ roomId }).orderBy("sortStamp", "desc")
    const res1 = await q1.limit(10).get<Table_AiChat>()
    const chats = res1.data

    let res = false
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      const { infoType } = v

      if(isContinueCommand) {
        if(!bot) break
        if(bot.character === v.character) {
          if(v.finish_reason === "stop") break
          res = true
          break
        }
        continue
      }

      if(infoType === "user") {
        res = v._id === chatId
        break
      }
      if(infoType === "clear") {
        break
      }
    }
    return res
  }

  static isCharacterAvailable(c: AiCharacter) {
    const _env = process.env
    if(c === "deepseek") {
      if(_env.LIU_DEEPSEEK_API_KEY && _env.LIU_DEEPSEEK_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "kimi") {
      if(_env.LIU_MOONSHOT_API_KEY && _env.LIU_MOONSHOT_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "wanzhi") {
      if(_env.LIU_YI_API_KEY && _env.LIU_YI_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "yuewen") {
      if(_env.LIU_STEPFUN_API_KEY && _env.LIU_STEPFUN_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "zhipu") {
      if(_env.LIU_ZHIPU_API_KEY && _env.LIU_ZHIPU_BASE_URL) {
        return true
      }
      return false
    }
    return false
  }


  private static _getToolMsg(
    tool_call_id: string,
    t: T_I18N,
    v: Table_AiChat,
  ) {
    const { funcName, contentId } = v

    let toolMsg: OaiToolPrompt | undefined
    if (funcName === "add_note") {
      if (contentId) {
        toolMsg = { role: "tool", content: t("added_note"), tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("not_agree_yet"), tool_call_id }
      }
    }
    else if (funcName === "add_todo") {
      if (contentId) {
        toolMsg = { role: "tool", content: t("added_todo"), tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("not_agree_yet"), tool_call_id }
      }
    }
    else if (funcName === "add_calendar") {
      if (contentId) {
        toolMsg = { role: "tool", content: t("added_calendar"), tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("not_agree_yet"), tool_call_id }
      }
    }
    else if(funcName === "web_search") {
      if(v.text && v.webSearchData && v.webSearchProvider) {
        toolMsg = { role: "tool", content: v.text, tool_call_id }
      }
    }

    return toolMsg
  }

  private static _turnToolCallIntoNormalAssistantMsg(
    t: T_I18N,
    v: Table_AiChat,
  ) {
    const { funcName, funcJson } = v
    if(!funcName) return
    const funcArgs = funcJson ? valTool.objToStr(funcJson) : "{}"
    const msg = t("bot_call_tools", { funcName, funcArgs })
    const assistantMsg: OaiPrompt = {
      role: "assistant",
      content: msg,
    }
    return assistantMsg
  }


  static turnChatsIntoPrompt(
    chats: Table_AiChat[],
    user: Table_User,
    opt?: TurnChatsIntoPromptOpt,
  ) {
    const _this = this
    const messages: OaiPrompt[] = []
    const { t } = useI18n(aiLang, { user })
    const abilities = opt?.abilities ?? ["chat"]
    const canUseTool = abilities.includes("tool_use")

    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      const { 
        infoType, 
        text, 
        imageUrl, 
        character, 
        fileBase64,
        msgType,
        tool_calls,
      } = v

      if(infoType === "user") {
        if(text) {
          messages.push({ role: "user", content: text })
        }
        else if(imageUrl) {
          messages.push({ 
            role: "user", 
            content: [{ type: "image_url", image_url: { url: imageUrl } }]
          })
        }
        else if(msgType === "voice" && fileBase64) {
          messages.push({
            role: "user",
            content: [{
              type: "input_audio",
              input_audio: {
                data: fileBase64,
                format: "mp3",
              }
            }]
          })
        }

      }
      else if(infoType === "assistant") {
        if(text) {
          messages.push({ role: "assistant", content: text, name: character })
        }
      }
      else if(infoType === "background" || infoType === "summary") {
        if(text) {
          messages.push({ role: "system", content: text })
        }
      }
      else if(infoType === "tool_use" && tool_calls) {
        const tool_call_id = tool_calls[0]?.id
        if(!tool_call_id) continue

        // add tool_call_result prompt 
        // where the role is "tool" and  tool_call_id is attached
        let toolMsg = _this._getToolMsg(tool_call_id, t, v)

        // if we can use tool
        if(canUseTool) {  
          if(toolMsg) {
            messages.push(toolMsg)
            messages.push({ role: "assistant", tool_calls, name: character })
          }
          continue
        }

        // otherwise, turn the tool_call_result prompt into a user prompt
        if(toolMsg) {
          messages.push({ role: "user", content: toolMsg.content }) 
        }
        const assistantMsg = _this._turnToolCallIntoNormalAssistantMsg(t, v)
        if(assistantMsg) {
          messages.push(assistantMsg)
        }

      }
      
    }

    return messages
  }

  static getMaxToken(
    totalToken: number,
    firstChat: Table_AiChat,
    bot: AiBot,
  ) {
    const restToken = (bot.maxWindowTokenK * 1000) - totalToken
    const firstToken = this.calculateChatToken(firstChat)
    let maxTokens = firstToken * 2
    if(maxTokens < 280) maxTokens = 280
    if(maxTokens > restToken) maxTokens = restToken
    if(maxTokens > MAX_WX_TOKEN) maxTokens = MAX_WX_TOKEN
    return maxTokens
  }

  static addQuotaForUser(entry: AiEntry) {
    // 1. add
    const user = entry.user
    const userId = user._id
    const quota = user.quota ?? { aiConversationCount: 0 }
    quota.aiConversationCount += 1
    if(entry.wx_gzh_openid) {
      quota.lastWxGzhChatStamp = getNowStamp()
    }

    // 2. update
    const u2: Partial<Table_User> = {
      quota,
      updatedStamp: getNowStamp(),
    }
    const uCol = db.collection("User")
    uCol.doc(userId).update(u2)
    
    return quota.aiConversationCount
  }

  static getTextFromLLM(
    res: OaiChatCompletion,
    bot?: AiBot,
  ) {
    let text = res.choices[0].message.content
    if(!text) return

    text = text.trim()

    // 1. remove "?" in the beginning for zhipu
    if(bot?.character === "zhipu") {
      let err1 = text.startsWith("？")
      if(err1) text = text.substring(1)
    }

    return text.trim()
  }

  static getFinishReason(
    res: OaiChatCompletion
  ): AiFinishReason | undefined {
    const reason = res.choices?.[0]?.finish_reason
    if(reason === "stop" || reason === "length") return reason
  }

  static getKickCharacters(
    characters: AiCharacter[],
    results: AiRunResults,
  ) {
    const cLength = characters.length
    if(cLength < 2) return []

    const kickList: AiCharacter[] = []
    const successList: AiCharacter[] = []

    // 1. add failed characters to kickList first
    characters.forEach(v => {
      const r = results.find(v2 => v2?.character === v)
      if(!r) kickList.push(v)
      else if(r.replyStatus === "has_new_msg") kickList.push(v)
      else successList.push(v)
    })

    // 2. and then add successful characters
    kickList.push(...successList)

    return kickList
  }

  static getAddedCharacters(
    characters: AiCharacter[],
    results: AiRunResults,
  ) {
    const cLength = characters.length
    if(cLength >= MAX_CHARACTERS) return []
    
    // 1. get available characters
    const availableCharacters = this.getAvailableCharacters()
    for(let i=0; i<availableCharacters.length; i++) {
      const v = availableCharacters[i]
      if(characters.includes(v)) {
        availableCharacters.splice(i, 1)
        i--
      }
    }
    if(availableCharacters.length <= 2) {
      return availableCharacters
    }

    // 2. select characters
    const selectNum = cLength >= (MAX_CHARACTERS - 1) ? 2 : 3
    const addedList: AiCharacter[] = []
    for(let i=0; i<selectNum; i++) {
      const aLength = availableCharacters.length
      if(aLength <= 1) {
        addedList.push(...availableCharacters)
        break
      }
      const r = Math.floor(Math.random() * aLength)
      const c = availableCharacters[r]
      addedList.push(c)
      availableCharacters.splice(r, 1)
    }

    return addedList
  }

  // only return chats when compression (turn images into text) succeeds
  static compressChats(chats: Table_AiChat[]) {
    if(chats.length < 1) return []

    // 1. check if we can compress
    let canCompress = true
    let firstAssistantIdx = -1
    let firstPhotoIdx = -1
    const cLength = chats.length
    const maxIndex1 = Math.min(cLength, 2)
    const maxIndex2 = Math.min(cLength, 5)
    for(let i=0; i<maxIndex2; i++) {
      const v = chats[i]
      const { msgType, imageUrl, infoType } = v

      // 1.2 if index is less than 2 and there is any image among the first 2 items
      // then we can't compress
      if(i < maxIndex1) {
        if(msgType === "image" || imageUrl) {
          canCompress = false
          break
        }
      }

      if(infoType === "assistant" && firstAssistantIdx < 0) {
        firstAssistantIdx = i
      }
      if((msgType === "image" || imageUrl) && firstPhotoIdx < 0) {
        firstPhotoIdx = i
      }
    }
    if(!canCompress) return

    // 2. if there is any photo in the first 5 messages
    if(firstPhotoIdx >= 0) {
      // 2.1 we cannot compress if there is no assistant message
      if(firstAssistantIdx < 0) return
      // 2.2 we cannot compress if the assistant message is after the first photo
      if(firstAssistantIdx > firstPhotoIdx) return
    }

    // 3. turn all images into text
    const newChats = chats.map(v => {
      const { msgType, imageUrl } = v
      if(msgType === "image" || imageUrl) {
        v.msgType = "text"
        v.text = "[image]"
        delete v.imageUrl
      }
      return v
    })
    return newChats
  }


  static needImageToTextAbility(
    chats: Table_AiChat[],
  ) {
    let need = false
    for(let i=0; i<chats.length; i++) {
      const chat = chats[i]
      if(chat.msgType === "image") {
        need = true
        break
      }
    }
    return need
  }

  static removeOneTool(funcName: string, tools: OaiTool[]) {
    for(let i=0; i<tools.length; i++) {
      const v = tools[i]
      if(v.type === "function" && v.function?.name === funcName) {
        tools.splice(i, 1)
        break
      }
    }
  }

  static getCharacterName(character: AiCharacter) {
    let name = ""
    const bot = aiBots.find(v => v.character === character)
    if(bot) name = bot.name
    return name
  }

}


class UserHelper {

  static async sendQuotaWarning2(entry: AiEntry) {
    // 1. get payment link
    const paymentLink = await this._getPaymentLink(entry)
    if(!paymentLink) return
    
    // 2. send
    const { user } = entry
    const { t } = useI18n(aiLang, { user })
    let msg = t("quota_warning_2", { 
      membershipTimes: MAX_TIMES_MEMBERSHIP,
      link: paymentLink,
    })

    TellUser.text(entry, msg)
  }

  static async sendQuotaWarning(entry: AiEntry) {
    // 1. get payment link
    const _env = process.env
    const paymentLink = await this._getPaymentLink(entry)
    if(!paymentLink) return

    // 2. i18n
    const { user } = entry
    const { t } = useI18n(aiLang, { user })
    let msg = t("quota_warning", { 
      freeTimes: MAX_TIMES_FREE,
      membershipTimes: MAX_TIMES_MEMBERSHIP,
      link: paymentLink,
    })
    const csLink = _env.LIU_CUSTOMER_SERVICE
    if(csLink) {
      msg += "\n\n"
      msg += t("deploy_tip", { link: csLink })
    }

    // 3. tell user
    TellUser.text(entry, msg)
  }

  private static async _getPaymentLink(entry: AiEntry) {
    // 1. check out domain
    const domain = getLiuDoman()

    // 2. get my order
    const order = await this._createOrderForQuota(entry)
    if(!order) return

    // 3. get payment link
    const orderId = order.order_id
    const paymentLink = `${domain}/payment/${orderId}`
    return paymentLink
  }

  private static async _createOrderForQuota(entry: AiEntry) {
    // 1. get param
    const { user, wx_gzh_openid } = entry
    const userId = user._id
    const stamp1 = getNowStamp() + MIN_3
    
    // 2. get existed order
    const oCol = db.collection("Order")
    const w2: Record<string, any> = {
      user_id: userId,
      oState: "OK",
      orderStatus: "INIT",
      orderType: "subscription",
      expireStamp: _.gte(stamp1),
    }
    if(wx_gzh_openid) {
      w2.channel = "wx_gzh"
    }
    const res2 = await oCol.where(w2).getOne<Table_Order>()
    let theOrder = res2.data ?? undefined

    // 3. calculate expireStamp
    if(!theOrder) {
      theOrder = await this._createOrder(entry)
    }

    return theOrder
  }

  private static async _createOrder(entry: AiEntry) {
    // 1. get subscription
    const sCol = db.collection("Subscription")
    const q1 = sCol.where({ isOn: "Y", payment_circle: "monthly" })
    const res1 = await q1.getOne<Table_Subscription>()
    const subPlan = res1.data
    if(!subPlan) return

    // 2. check out amount_CNY
    if(typeof subPlan.amount_CNY !== "number") {
      return
    }

    // 3. create order_id
    const order_id = await createAvailableOrderId()
    if(!order_id) return

    // 4. construct an order
    const { user, wx_gzh_openid } = entry
    const userId = user._id
    const b4 = getBasicStampWhileAdding()
    const data4: Partial_Id<Table_Order> = {
      ...b4,
      user_id: userId,
      order_id,
      oState: "OK",
      orderStatus: "INIT",
      orderType: "subscription",
      orderAmount: subPlan.amount_CNY,
      paidAmount: 0,
      refundedAmount: 0,
      currency: "cny",
      plan_id: subPlan._id,
      expireStamp: getNowStamp() + MIN_30,
    }
    if(wx_gzh_openid) {
      data4.channel = "wx_gzh"
    }

    // 5. add the order
    const oCol = db.collection("Order")
    const res5 = await oCol.add(data4)
    const id5 = getDocAddId(res5)
    if(!id5) return

    const newOrder: Table_Order = {
      _id: id5,
      ...data4,
    }
    return newOrder
  }

}

class TellUser {

  static async text(
    entry: AiEntry, 
    text: string,
    from?: AiBot,
    fromCharacter?: AiCharacter
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
      const kf_account = this._getWxGzhKfAccount(from, fromCharacter)
      if(kf_account) {
        obj1.customservice = { kf_account }
      }
      const res1 = await this._sendToWxGzh(wx_gzh_openid, obj1)
      return res1
    }

  }


  static async menu(
    entry: AiEntry,
    prefixMessage: string,
    menuList: AiMenuItem[],
    suffixMessage: string,
  ) {
    const _env = process.env
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
        const characterName = AiHelper.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({ id: "kick_" + character, content: t("kick") + characterName })
      }

      if(operation === "add" && character) {
        const characterName = AiHelper.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({ id: "add_" + character, content: t("add") + characterName })
      }
    }

    // 2. send to wx gzh
    if(wx_gzh_openid) {
      if(_env.LIU_WX_GZ_TYPE === "subscription_account") {
        console.warn("we cannot send the menu to the user due to subscription_account")
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
      console.warn("see wx_menu_list: ")
      console.log(wx_menu_list)
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

  

  private static _getWxGzhKfAccount(
    bot?: AiBot,
    character?: AiCharacter,
  ) {
    let c = bot?.character ?? character
    if(!c) return

    const _env = process.env
    if(c === "deepseek") {
      return _env.LIU_WXGZH_KF_DEEPSEEK
    }
    else if(c === "kimi") {
      return _env.LIU_WXGZH_KF_KIMI
    }
    else if(c === "wanzhi") {
      return _env.LIU_WXGZH_KF_WANZHI
    }
    else if(c === "yuewen") {
      return _env.LIU_WXGZH_KF_YUEWEN
    }
    else if(c === "zhipu") {
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
