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
  type OaiChoice,
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
  type AiAbility,
  type T_I18N,
  type AiImageSizeType,
  type AiToolGetCardType,
  Ns_Zhipu,
  LiuAi,
  Sch_AiToolGetScheduleParam,
  Sch_AiToolGetCardsParam,
  Ns_SiliconFlow,
  type AiApiEndpoint,
  type AiToolGetScheduleHoursFromNow,
  type AiToolGetScheduleSpecificDate,
  type AiToolGetScheduleParam,
  type Table_Content,
  type SortWay,
  type Table_Workspace,
  type AiBotMetaData,
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
  decryptEncData,
  getSummary,
  SpaceUtil,
  sortListWithIds,
} from "@/common-util"
import { WxGzhSender } from "@/service-send"
import { 
  getBasicStampWhileAdding, 
  getNowStamp, 
  HOUR, 
  isWithinMillis, 
  localizeStamp, 
  DAY,
  MINUTE,
  SECONED,
} from "@/common-time"
import { 
  aiBots, 
  aiI18nChannel, 
  aiI18nShared,
  aiTools,
} from "@/ai-prompt"
import cloud from "@lafjs/cloud"
import { useI18n, aiLang, getCurrentLocale } from "@/common-i18n"
import * as vbot from "valibot"
import { WxGzhUploader } from "@/file-utils"
import FormData from "form-data"
import axios from 'axios';
import { createRandom } from "@/common-ids"
import { addDays, set as date_fn_set } from "date-fns"



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

const SEC_15 = SECONED * 15
const MIN_3 = MINUTE * 3
const MIN_30 = MINUTE * 30
const INDEX_TO_PRESERVE_IMAGES = 12     // the images which appears in the first INDEX_TO_PRESERVE_IMAGES will be preserved rather than compressed to text like [image]

/************************** types ************************/

interface AiCard {
  title: string
  summary: string
  contentId: string
  hasImage: boolean
  hasFile: boolean
  calendarStamp?: number
  createdStamp: number
}

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

interface AiRunLog_A {
  toolName: "get_schedule"
  hoursFromNow?: AiToolGetScheduleHoursFromNow
  specificDate?: AiToolGetScheduleSpecificDate
}

interface AiRunLog_B {
  toolName: "get_cards"
  cardType: AiToolGetCardType
}

interface AiRunLog_C {
  toolName: "draw_picture"
  drawResult: LiuAi.PaletteResult
}

export type AiRunLog = (AiRunLog_A | AiRunLog_B | AiRunLog_C) & {
  character: AiCharacter
  textToUser: string
  logStamp: number
}

interface AiRunSuccess {
  character: AiCharacter
  replyStatus: "yes" | "has_new_msg"
  assistantChatId?: string
  chatCompletion?: OaiChatCompletion
  toolName?: string
  logs?: AiRunLog[]
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
  drawPictureUrl?: string
  drawPictureModel?: string
  drawPictureData?: Record<string, any>
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
  metaData?: AiBotMetaData
}

interface BaseLLMChatOpt {
  maxTryTimes?: number
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
  const { msg_type, image_url, text, file_blob } = entry
  if(msg_type === "text" && !text) return
  if(msg_type === "image" && !image_url) return
  if(msg_type === "voice" && !file_blob) return

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

  // 4.2 transcibe voice msg
  if(msg_type === "voice" && file_blob) {
    
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
  if(c === "baixiaoying") {
    const botBaichuan = new BotBaichuan()
    const proBaichuan = botBaichuan.run(aiParam)
    promises.push(proBaichuan)
  }
  if(c === "deepseek") {
    const bot1 = new BotDeepSeek()
    const pro1 = bot1.run(aiParam)
    promises.push(pro1)
  }
  else if(c === "hailuo") {
    const botMinimax = new BotMiniMax()
    const proMinimax = botMinimax.run(aiParam)
    promises.push(proMinimax)
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

    // 6. is it viewing status directive?
    const res6 = this.isViewingStatus(text2)
    if(res6) {
      this.toViewStatus(entry)
      return { theCommand: "group_status" }
    }

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

  private static async toViewStatus(entry: AiEntry) {
    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return
    const user = entry.user
    const { t } = useI18n(aiLang, { user })
    let msg = t("status_1") + "\n"

    // 2. get assistants
    const { characters } = room
    if(characters.length < 1) {
      msg += (t("no_member") + "\n")
    }
    else {
      characters.forEach(v => {
        const name = AiHelper.getCharacterName(v)
        if(name) msg += (name + "\n")
      })
    }
    msg += "\n"

    // 3. get quota
    msg += (t("status_2") + "\n")
    const quota = user.quota
    const usedTimes = quota?.aiConversationCount ?? 0
    const isSubscribed = checkIfUserSubscribed(user)
    const maxTimes = isSubscribed ? MAX_TIMES_MEMBERSHIP : MAX_TIMES_FREE
    msg += (t("status_3", { usedTimes }) + "\n")
    if(isSubscribed) {
      msg += t("status_5", { maxTimes })
    }
    else {
      msg += t("status_4", { maxTimes })
    }

    // 4. text user
    TellUser.text(entry, msg)
  }

  private static isViewingStatus(text: string) {
    const prefix = [
      "群聊状态", "查看群聊状态",
      "群聊狀態", "檢視群聊狀態",
      "Status", "Group Status",
    ]
    const res1 = this._areTheyMatched(prefix, text)
    return res1
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
    params: OpenAI.Chat.ChatCompletionCreateParams,
    opt?: BaseLLMChatOpt,
  ): Promise<OaiChatCompletion | undefined> {
    const _this = this
    const client = _this._client
    if(!client) return

    _this._tryTimes++
    const timeout = _this._tryTimes > 1 ? 15000 : 30000

    try {
      const chatCompletion = await client.chat.completions.create(params, {
        timeout,
      })
      _this._tryTimes = 0
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

      if(typeof errMsg === "string") {
        // for baichuan
        if(isRateLimit) {
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
        
      }

      const maxTryTimes = opt?.maxTryTimes ?? 2
      if(_this._tryTimes < maxTryTimes && isRateLimit) {
        console.log("getting to try again!")
        await valTool.waitMilli(1000)
        const triedRes = await _this.chat(params, opt)
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
    AiHelper.finalCheckPrompts(params.messages)

    // print last 5 prompts
    const msgLength = params.messages.length
    console.log(`last 5 prompts: `)
    if(msgLength > 5) {
      const messages2 = params.messages.slice(msgLength - 5)
      const printMsg = valTool.objToStr({ messages: messages2 })
      console.log(printMsg)
    }
    else {
      console.log(params.messages)
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
        const newChats = AiHelper.compressChatsForImages(chats)
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
      { abilities: bot.abilities, metaData: bot.metaData },
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
    // 1. check out params
    const { aiParam, bot, chatCompletion } = postParam
    if(chatCompletion) {
      const text = AiHelper.getTextFromLLM(chatCompletion, bot)
      if(text) {
        console.warn("_handleToolUse text 存在，先暂停！")
        console.log(text)
        return
      }
    }

    // 2. define some constants
    const character = this._character
    const botName = AiHelper.getCharacterName(character)
    const { t } = useI18n(aiLang, { user: aiParam.entry.user })
    const aiLogs: AiRunLog[] = []
    const toolHandler = new ToolHandler(
      aiParam, 
      bot,
      tool_calls,
      chatCompletion,
    )

    for(let i=0; i<tool_calls.length; i++) {
      const v = tool_calls[i]
      const funcData = v["function"]

      if(v.type !== "function" || !funcData) continue
      const tool_call_id = v.id

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
        const searchRes = await toolHandler.web_search(funcJson)
        if(searchRes) {
          this._continueAfterWebSearch(
            postParam, 
            tool_calls, 
            searchRes, 
            tool_call_id,
          )
          break
        }
      }
      else if(funcName === "draw_picture") {
        const drawRes = await toolHandler.draw_picture(funcJson)
        if(!drawRes) continue
        const drawTextToUser = t("bot_draw", { 
          botName: botName ?? "", 
          model: drawRes.model,
        })
        const drawLog: AiRunLog = {
          toolName: "draw_picture",
          drawResult: drawRes,
          character,
          textToUser: drawTextToUser,
          logStamp: getNowStamp(),
        }
        aiLogs.push(drawLog)
      }
      else if(funcName === "get_schedule") {
        const scheduleRes = await toolHandler.get_schedule(funcJson)
        if(!scheduleRes) continue

        await this._continueAfterReadingCards(
          postParam,
          tool_calls,
          scheduleRes,
          tool_call_id,
        )

        if(scheduleRes.textToUser) {
          const scheduleLog: AiRunLog = {
            toolName: "get_schedule",
            hoursFromNow: funcJson.hoursFromNow,
            specificDate: funcJson.specificDate,
            character,
            textToUser: scheduleRes.textToUser,
            logStamp: getNowStamp(),
          }
          aiLogs.push(scheduleLog)
        }
        
      }
      else if(funcName === "get_cards") {
        const cardsRes = await toolHandler.get_cards(funcJson)
        if(!cardsRes) continue

        await this._continueAfterReadingCards(
          postParam,
          tool_calls,
          cardsRes,
          tool_call_id,
        )

        if(cardsRes.textToUser) {
          const cardLog: AiRunLog = {
            toolName: "get_cards",
            cardType: funcJson.cardType,
            character: this._character,
            textToUser: cardsRes.textToUser,
            logStamp: getNowStamp(),
          }
          aiLogs.push(cardLog)
        }
      }
    }

    return aiLogs
  }

  


  private _getRestTokensAndPrompts(
    postParam: PostRunParam,
  ) {
    // 1. pre handle prompt and restTokens
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

  private async _continueAfterReadingCards(
    postParam: PostRunParam,
    tool_calls: OaiToolCall[],
    readRes: LiuAi.ReadCardsResult,
    tool_call_id: string,
  ) {
    // 1. handle max tokens
    const data1 = this._getRestTokensAndPrompts(postParam)
    if(!data1) return
    let { restTokens, prompts } = data1
    const textToBot = readRes.textToBot
    const token1 = AiHelper.calculateTextToken(textToBot)
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
        console.warn("not enough rest tokens!")
        return
      }
    }

    // 2. get some params
    const c = this._character
    const assistantName = AiHelper.getCharacterName(c)
    const { chatParam, bot, aiParam } = postParam
    const canUseTool = bot.abilities.includes("tool_use")

    // 3. add new prompts with tool_calls and its result
    if(canUseTool) {
      prompts.push({ role: "assistant", tool_calls, name: assistantName })
      prompts.push({
        role: "tool",
        content: textToBot,
        tool_call_id,
      })
    }
    else {
      const { t } = useI18n(aiLang, { user: aiParam.entry.user })
      const newPrompts = AiHelper.turnToolCallsIntoNormalPrompts(
        tool_calls,
        tool_call_id,
        textToBot,
        t,
        assistantName,
      )
      console.warn("see newPrompts in _continueAfterReadingCards: ")
      console.log(newPrompts)
      if(newPrompts.length < 1) return
      prompts.push(...newPrompts)
    }


    // 4. new chat create param
    const newChatParam: OaiCreateParam = { 
      ...chatParam,
      messages: prompts,
      max_tokens: restTokens,
    }
    const res4 = await this.chat(newChatParam, bot)
    if(!res4) return

    // 5. handle text from response
    const assistantChatId = await this._handleAssistantText(res4, aiParam, bot)
    if(!assistantChatId) {
      console.warn("no assistantChatId in _continueAfterReadingCards")
      console.log(res4)
      return
    }
  }

  private async _continueAfterWebSearch(
    postParam: PostRunParam,
    tool_calls: OaiToolCall[],
    searchRes: LiuAi.SearchResult,
    tool_call_id: string,
  ) {
    // 1. handle max tokens
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
        console.warn("not enough rest tokens!")
        return
      }
    }

    // 2. get some params
    const c = this._character
    const assistantName = AiHelper.getCharacterName(c)
    const { chatParam, aiParam, bot } = postParam
    const canUseTool = bot.abilities.includes("tool_use")

    // 3. add prompts with tool_calls and its result
    if(canUseTool) {
      prompts.push({ role: "assistant", tool_calls, name: assistantName })
      prompts.push({
        role: "tool",
        content: searchMarkdown,
        tool_call_id,
      })
    }
    else {
      const { t } = useI18n(aiLang, { user: aiParam.entry.user })
      const newPrompts = AiHelper.turnToolCallsIntoNormalPrompts(
        tool_calls,
        tool_call_id,
        searchMarkdown,
        t,
        assistantName,
      )
      console.warn("see newPrompts in _continueAfterWebSearch: ")
      console.log(newPrompts)
      if(newPrompts.length < 1) return
      prompts.push(...newPrompts)
    }

    // 4. new chat create param
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

  private _handleLength(message: OaiMessage) {
    let content = message.content
    if(!content) return
    content = content.trimEnd()
    const tmpList = content.split("\n")
    if(tmpList.length < 5) return
    tmpList.pop()
    message.content = tmpList.join("\n")
    console.warn("see message.content in _handleLength: ")
    console.log(message.content)
  }

  protected async postRun(postParam: PostRunParam): Promise<AiRunSuccess | undefined> {
    // 1. get params
    const { bot, chatCompletion, aiParam } = postParam
    if(!chatCompletion) return
    const c = bot.character

    let firstChoice = chatCompletion?.choices?.[0]
    if(!firstChoice) {
      console.warn(`${c} no choice! see chatCompletion: `)
      console.log(chatCompletion)
      return
    }
    let { finish_reason, message } = firstChoice
    if(!message) return
    let { tool_calls } = message

    // 1.1 try to transform text into tool
    const res1 = TransformText.handlefromAssistantChoice(firstChoice)
    if(res1) {
      finish_reason = firstChoice.finish_reason
      message = firstChoice.message
      tool_calls = message.tool_calls
    }

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
    let aiLogs: AiRunLog[] | undefined
    if(finish_reason === "tool_calls" && tool_calls) {
      aiLogs = await this._handleToolUse(postParam, tool_calls)
    }
    
    // 4. finish reason is "length"
    if(finish_reason === "length") {
      this._handleLength(message)
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
      logs: aiLogs,
    }
  }

}

class BotBaichuan extends BaseBot {
  constructor() {
    super("baixiaoying")
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

class BotMiniMax extends BaseBot {
  constructor() {
    super("hailuo")
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things
    // turn parameters into `string` in tools
    if(tools) {
      tools.forEach(v => {
        v.function.parameters = valTool.objToStr(v.function.parameters) as any
      })
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

  // decide whether to send "typing"
  private _handleSendTyping(aiParam: AiRunParam) {
    const { chats, entry } = aiParam
    if(chats.length < 3) {
      TellUser.typing(entry)
      return
    }
    const secondChat = chats[1]
    if(secondChat.infoType === "user") {
      const hasTyping = isWithinMillis(secondChat.insertedStamp, SEC_15)
      if(hasTyping) return
    }
    TellUser.typing(entry)
  }

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
    this._handleSendTyping(aiParam)

    // 4. wait for all promises
    const res4 = await Promise.all(promises)
    let hasEverSucceeded = false
    let hasEverUsedTool = false
    const aiLogs: AiRunLog[] = []
    for(let i=0; i<res4.length; i++) {
      const v = res4[i]
      if(v && v.replyStatus === "yes") {
        hasEverSucceeded = true
        if(v.toolName) hasEverUsedTool = true
        if(v.logs) aiLogs.push(...v.logs)
      }
    }
    if(!hasEverSucceeded) return

    // 5. add quota for user
    const num5 = AiHelper.addQuotaForUser(entry)
    if(aiLogs.length > 0) {
      this.sendFallbackMenu(aiParam, res4, aiLogs) 
    }
    else if((num5 % 3) === 2 && !hasEverUsedTool) {
      this.sendFallbackMenu(aiParam, res4, aiLogs)
    }

  }

  private async sendFallbackMenu(
    aiParam: AiRunParam,
    results: AiRunResults,
    all_logs: AiRunLog[],
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

    // 2.1 extract all logs
    const privacyLogs = all_logs.filter(v => {
      const bool = Boolean(v.toolName === "get_cards" || v.toolName === "get_schedule")
      return bool
    })
    const workingLogs = all_logs.filter(v => v.toolName === "draw_picture")

    // 2.2 privacy tips
    if(privacyLogs.length > 0) {
      privacyLogs.sort((a, b) => a.logStamp - b.logStamp)
      prefixMessage += (t("privacy_title") + "\n")
      privacyLogs.forEach(v => {
        prefixMessage += (v.textToUser + "\n")
      })
      prefixMessage += "\n"
    }

    // 2.3 working logs
    if(workingLogs.length > 0) {
      workingLogs.sort((a, b) => a.logStamp - b.logStamp)
      prefixMessage += (t("working_log_title") + "\n")
      workingLogs.forEach(v => {
        prefixMessage += (v.textToUser + "\n")
      })
      prefixMessage += "\n"
    }

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
    await valTool.waitMilli(500)
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
    AiHelper.finalCheckPrompts(prompts)

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
    return assistantChatId
  }

  private _getAgreeAndEditLinks(assistantChatId: string) {
    const domain = getLiuDoman()

    // WIP: compose page
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

  private async _getDrawResult(
    prompt: string, 
    sizeType: AiImageSizeType,
  ) {
    // 1. get param
    let res: LiuAi.PaletteResult | undefined
    const bot = this._bot
    const c = bot.character
    
    // 2. translate if needed
    let imagePrompt = prompt
    const num2 = valTool.getChineseCharNum(prompt)
    console.warn("chinese char num: ", num2)
    if(num2 > 3) {
      const user = this._aiParam.entry.user
      const translator = new Translator(bot, user)
      const res2 = await translator.run(prompt)
      if(!res2) {
        console.warn("fail to translate")
      }
      else {
        imagePrompt = res2.translatedText
      }
    }

    // 3. run by zhipu if character is zhipu
    if(c === "zhipu") {
      res = await Palette.runByZhipu(imagePrompt, sizeType)
      if(res) return res
    }

    // 4. run 
    res = await Palette.run(imagePrompt, sizeType)
    return res
  }

  async draw_picture(
    funcJson: Record<string, any>
  ): Promise<LiuAi.PaletteResult | undefined> {
    // 1. check out param
    const prompt = funcJson.prompt
    if(!prompt || typeof prompt !== "string") {
      console.warn("draw_picture prompt is not string")
      console.log(funcJson)
      return
    }
    let sizeType = funcJson.sizeType as AiImageSizeType
    if(sizeType !== "portrait" && sizeType !== "square") {
      sizeType = "square"
    }

    // 2. add message first because text_to_image may take a long time
    const data2: Partial<AiHelperAssistantMsgParam> = {
      funcName: "draw_picture",
      funcJson,
      text: prompt,
    }
    const assistantChatId = await this._addMsgToChat(data2)
    if(!assistantChatId) return

    // 3. draw
    let res3 = await this._getDrawResult(prompt, sizeType)
    if(!res3) return

    // 4. update assistant msg
    const data4: Partial<Table_AiChat> = {
      drawPictureUrl: res3.url,
      drawPictureData: res3.originalResult,
      drawPictureModel: res3.model,
    }
    if(prompt !== res3.prompt) {
      data4.text = res3.prompt
    }

    AiHelper.updateAiChat(assistantChatId, data4)

    // 5. reply image
    const { entry } = this._aiParam
    await TellUser.image(entry, res3.url, this._bot)

    return res3
  }

  async get_schedule(
    funcJson: Record<string, any>,
  ): Promise<LiuAi.ReadCardsResult | undefined> {
    // 1. checking out param
    const res1 = vbot.safeParse(Sch_AiToolGetScheduleParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse get_schedule param: ")
      console.log(funcJson)
      console.log(res1.issues)
      return
    }
    const { hoursFromNow, specificDate } = funcJson as AiToolGetScheduleParam
    if(!hoursFromNow && !specificDate) {
      console.warn("hoursFromNow or specificDate is required")
      return
    }

    // 2. construct basic query
    const entry = this._aiParam.entry
    const bot = this._bot
    const { user } = entry
    const q2: Record<string, any> = {
      user: user._id,
      spaceType: "ME",
      infoType: "THREAD",
      oState: "OK",
      storageState: "CLOUD",
      aiReadable: "Y",
    }
    let sortWay: SortWay = "asc"

    // 2.1 define replied text
    let textToBot = ""
    let textToUser = ""
    const { t } = useI18n(aiLang, { user })

    // 3. handle hoursFromNow
    const now3 = getNowStamp()
    if(hoursFromNow) {
      if(hoursFromNow < 0) {
        sortWay = "desc"
        const command3_1 = _.lt(now3)
        const command3_2 = _.gte(now3 + hoursFromNow * HOUR)
        q2.calendarStamp = _.and(command3_1, command3_2)
        textToBot = t("schedule_last", { hour: hoursFromNow })
        textToUser = t("bot_read_last", { bot: bot.name, hour: hoursFromNow })
      }
      else {
        const command3_3 = _.gt(now3)
        const command3_4 = _.lte(now3 + hoursFromNow * HOUR)
        q2.calendarStamp = _.and(command3_3, command3_4)
        textToBot = t("schedule_next", { hour: hoursFromNow })
        textToUser = t("bot_read_next", { bot: bot.name, hour: hoursFromNow })
      }
    }

    // 4. handle specificDate
    if(specificDate) {
      const userStamp = localizeStamp(now3, user.timezone)
      const diffStampBetweenUserAndServer = userStamp - now3
      const currentDate = new Date(userStamp)
      const todayDate = date_fn_set(currentDate, {
        hours: 0, minutes: 0, seconds: 0, milliseconds: 0,
      })
      const yesterdayDate = addDays(todayDate, -1)
      const tomorrowDate = addDays(todayDate, 1)
      const theDayAfterTomorrowDate = addDays(todayDate, 2)
      const todayStamp = todayDate.getTime() - diffStampBetweenUserAndServer
      const tomorrowStamp = tomorrowDate.getTime() - diffStampBetweenUserAndServer

      if(specificDate === "yesterday") {
        const yesterdayStamp = yesterdayDate.getTime() - diffStampBetweenUserAndServer
        const command4_1 = _.gte(yesterdayStamp)
        const command4_2 = _.lt(todayStamp)
        q2.calendarStamp = _.and(command4_1, command4_2)
        textToBot = t("schedule_yesterday")
        textToUser = t("bot_read_yesterday", { bot: bot.name })
      }
      else if(specificDate === "today") {
        const command4_3 = _.gte(todayStamp)
        const command4_4 = _.lt(tomorrowStamp)
        q2.calendarStamp = _.and(command4_3, command4_4)
        textToBot = t("schedule_today")
        textToUser = t("bot_read_today", { bot: bot.name })
      }
      else if(specificDate === "tomorrow") {
        const theDayAfterTomorrowStamp = theDayAfterTomorrowDate.getTime() - diffStampBetweenUserAndServer
        const command4_5 = _.gte(tomorrowStamp)
        const command4_6 = _.lt(theDayAfterTomorrowStamp)
        q2.calendarStamp = _.and(command4_5, command4_6)
        textToBot = t("schedule_tomorrow")
        textToUser = t("bot_read_tomorrow", { bot: bot.name })
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

    console.warn("see textToUser: ")
    console.log(textToUser)
    console.warn("see textToBot: ")
    console.log(textToBot)

    // 8. add msg
    const data8: Partial<AiHelperAssistantMsgParam> = {
      funcName: "get_schedule",
      funcJson,
      text: hasData ? textToUser : textToBot,
    }
    const assistantChatId = await this._addMsgToChat(data8)
    if(!assistantChatId) return

    return {
      textToUser,
      textToBot,
      assistantChatId,
    }
  }

  async get_cards(
    funcJson: Record<string, any>
  ): Promise<LiuAi.ReadCardsResult | undefined> {
    // 1. checking out param
    const res1 = vbot.safeParse(Sch_AiToolGetCardsParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse get_cards param: ")
      console.log(funcJson)
      console.log(res1.issues)
      return
    }
    const cardType = funcJson.cardType as AiToolGetCardType

    // 2. construct basic query
    const entry = this._aiParam.entry
    const bot = this._bot
    const { user } = entry
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
      contents = await this._getCardsForState(cardType, userId, q2)
      if(!contents) return
      if(cardType === "TODO") {
        textToBot = t("todo_cards")
        textToUser = t("bot_read_todo", { bot: bot.name })
      }
      else if(cardType === "FINISHED") {
        textToBot = t("finished_cards")
        textToUser = t("bot_read_finished", { bot: bot.name })
      }
    }
    else if(cardType === "EVENT") {
      q2.calendarStamp = _.gt(getNowStamp() - DAY)
      const q3_1 = cCol.where(q2).orderBy("createdStamp", "desc").limit(10)
      const res3_1 = await q3_1.get<Table_Content>()
      contents = res3_1.data
      textToBot = t("event_cards")
      textToUser = t("bot_read_event", { bot: bot.name })
    }
    else {
      const q3_2 = cCol.where(q2).orderBy("createdStamp", "desc").limit(10)
      const res3_2 = await q3_2.get<Table_Content>()
      contents = res3_2.data
      textToBot = t("note_cards")
      textToUser = t("bot_read_note", { bot: bot.name })
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

    console.warn("see textToUser: ")
    console.log(textToUser)
    console.warn("see textToBot: ")
    console.log(textToBot)

    // 8. add msg
    const data8: Partial<AiHelperAssistantMsgParam> = {
      funcName: "get_cards",
      funcJson,
      text: hasData ? textToUser : textToBot,
    }
    const assistantChatId = await this._addMsgToChat(data8)
    if(!assistantChatId) return

    return {
      textToUser,
      textToBot,
      assistantChatId,
    }
  }


  private async _getCardsForState(
    cardType: "TODO" | "FINISHED",
    userId: string,
    q: Record<string, any>,
  ): Promise<Table_Content[] | undefined> {
    // 1. get space
    const q1: Partial<Table_Workspace> = {
      infoType: "ME",
      owner: userId,
      oState: "OK",
    }
    const wCol = db.collection("Workspace")
    const res1 = await wCol.where(q1).getOne<Table_Workspace>()
    const space = res1.data
    if(!space) return

    // 2. get the state
    const sCfg = space.stateConfig ?? SpaceUtil.getDefaultStateCfg()
    const theState = sCfg.stateList.find(v => v.id === cardType)
    const ids = theState?.contentIds ?? []
    if(ids.length < 1) return []

    // 3. query contents
    if(ids.length > 10) {
      ids.splice(10, ids.length - 10)
    }
    q._id = _.in(ids)
    const cCol = db.collection("Content")
    const res3 = await cCol.where(q).get<Table_Content>()
    const contents = res3.data
    if(contents.length < 2) return contents
    const sortedContents = sortListWithIds(contents, ids)
    return sortedContents
  }

}


class TransformContent {


  static getCardData(v: Table_Content) {
    const data = decryptEncData(v)
    if(!data.pass) return
    const summary = getSummary(data.liuDesc)
    const obj: AiCard = {
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

  static toPlainText(v: AiCard, user?: Table_User) {
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


class AiHelper {

  // try to remove `tool` prompt when the previous prompt is not assistant
  static finalCheckPrompts(prompts: OaiPrompt[]) {
    if(prompts.length < 3) return
    const firstPrompt = prompts[0]
    const secondPrompt = prompts[1]
    if(firstPrompt.role === "system") {
      if(secondPrompt.role === "tool" && secondPrompt.tool_call_id) {
        prompts.splice(1, 1)
      }
      return
    }

    if(firstPrompt.role === "tool" && firstPrompt.tool_call_id) {
      prompts.splice(0, 1)
    }
  }

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

  static getApiEndpointFromBot(bot: AiBot): AiApiEndpoint | undefined {
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
    else if(p === "baichuan") {
      apiKey = _env.LIU_BAICHUAN_API_KEY
      baseURL = _env.LIU_BAICHUAN_BASE_URL
    }
    else if(p === "deepseek") {
      apiKey = _env.LIU_DEEPSEEK_API_KEY
      baseURL = _env.LIU_DEEPSEEK_BASE_URL
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
      file_type,
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
      fileType: file_type,
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
      drawPictureUrl: param.drawPictureUrl,
      drawPictureModel: param.drawPictureModel,
      drawPictureData: param.drawPictureData,
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

        if(imageNum > 3 || i > INDEX_TO_PRESERVE_IMAGES) {
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
    const { 
      infoType, 
      usage, 
      text, 
      imageUrl, 
      msgType,
    } = chat
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
    
    if(infoType === "tool_use") {
      const toolToken1 = usage?.completion_tokens ?? 0
      let toolToken2 = 0
      if(chat.funcName) {
        toolToken2 += this.calculateTextToken(chat.funcName)
      }
      if(chat.funcJson) {
        const jsonStr = valTool.objToStr(chat.funcJson)
        toolToken2 += this.calculateTextToken(jsonStr)
      }
      toolToken2 += 10
      token += Math.max(toolToken1, toolToken2)
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

    if(c === "baixiaoying") {
      if(_env.LIU_BAICHUAN_API_KEY && _env.LIU_BAICHUAN_BASE_URL) {
        return true
      }
      return false
    }
    if(c === "deepseek") {
      if(_env.LIU_DEEPSEEK_API_KEY && _env.LIU_DEEPSEEK_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "hailuo") {
      if(_env.LIU_MINIMAX_API_KEY && _env.LIU_MINIMAX_BASE_URL) {
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
    else if(funcName === "draw_picture") {
      if(v.text && v.drawPictureUrl) {
        toolMsg = { 
          role: "tool", 
          content: `[Finish to draw]`, 
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

    return toolMsg
  }

  // 调用完工具后，将返回结果返回 LLM 时，若当前模型不支持 tool_use
  // 对返回结果进行转换
  static turnToolCallsIntoNormalPrompts(
    tool_calls: OaiToolCall[],
    tool_call_id: string,
    toolResultText: string,
    t: T_I18N,
    assistantName?: string,
  ): OaiPrompt[] {
    const theTool = tool_calls.find(v => v.id === tool_call_id)
    if(!theTool) return []

    const theFunc = theTool["function"]
    if(!theFunc) return []
    const funcName = theFunc.name
    const funcArgs = theFunc.arguments || "{}"
    const msg = t("bot_call_tools", { funcName, funcArgs })

    const prompts: OaiPrompt[] = [
      {
        role: "assistant",
        content: msg,
        name: assistantName,
      },
      {
        role: "user",
        content: toolResultText,
      }
    ]
    return prompts
  }

  private static _turnToolCallIntoNormalAssistantMsg(
    t: T_I18N,
    v: Table_AiChat,
    opt?: TurnChatsIntoPromptOpt,
  ) {
    // 1. get params
    const { funcName, funcJson, character } = v
    if(!funcName) return
    
    // 2. change prompt if funcName is draw_picture
    // just because text field storages the translated prompt
    if(funcName === "draw_picture" && v.text && funcJson) {
      funcJson.prompt = v.text
    }

    // 3. handle content
    const funcArgs = funcJson ? valTool.objToStr(funcJson) : "{}"
    const msg = t("bot_call_tools", { funcName, funcArgs })
    const assistantName = AiHelper.getCharacterName(character)
    const assistantMsg: OaiPrompt = {
      role: "assistant",
      content: msg,
      name: assistantName,
    }
    return assistantMsg
  }

  private static _getAssistantMsgWithToolMsg(
    tool_calls: OaiToolCall[],
    v: Table_AiChat,
  ) {
    const { character, funcName, text } = v
    const assistantName = this.getCharacterName(character)
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
          // messages.push({
          //   role: "user",
          //   content: [{
          //     type: "input_audio",
          //     input_audio: {
          //       data: fileBase64,
          //       format: "mp3",
          //     }
          //   }]
          // })
        }

      }
      else if(infoType === "assistant") {
        if(text) {
          const assistantName = this.getCharacterName(character)
          messages.push({ role: "assistant", content: text, name: assistantName })
        }
      }
      else if(infoType === "summary") {
        if(!text) continue
        const summary = `【前方对话摘要】\n${text}`
        messages.push({
          role: opt?.metaData?.onlyOneSystemRoleMsg ? "user" : "system",
          content: summary,
        })
      }
      else if(infoType === "background") {
        if(!text) continue
        const background = `【背景信息】\n${text}`
        messages.push({
          role: opt?.metaData?.onlyOneSystemRoleMsg ? "user" : "system",
          content: background,
        })
      }
      else if(infoType === "tool_use" && tool_calls) {
        const tool_call_id = tool_calls[0]?.id
        if(!tool_call_id) continue

        // 1. add tool_call_result prompt 
        // where the role is "tool" and  tool_call_id is attached
        let toolMsg = _this._getToolMsg(tool_call_id, t, v)

        // 2. if we can use tool
        if(canUseTool) {  
          if(toolMsg) {
            messages.push(toolMsg)
            let assistantMsg2 = _this._getAssistantMsgWithToolMsg(tool_calls, v)
            messages.push(assistantMsg2)
            continue
          }
        }

        // 3. otherwise, turn the tool_call_result prompt into a user prompt
        if(toolMsg) {
          messages.push({ role: "user", content: toolMsg.content }) 
        }
        const assistantMsg3 = _this._turnToolCallIntoNormalAssistantMsg(t, v, opt)
        if(assistantMsg3) {
          messages.push(assistantMsg3)
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
    const choices = res?.choices
    if(!choices || choices.length < 1) {
      console.warn("no choices in getTextFromLLM")
      console.log(res)
      return
    }

    let message = choices[0].message
    if(!message) {
      console.warn("no message in getTextFromLLM")
      console.log(choices)
      return
    }

    let text = message.content
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
  static compressChatsForImages(chats: Table_AiChat[]) {
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
      else if(infoType === "tool_use" && firstAssistantIdx < 0) {
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

  static getCharacterName(character?: AiCharacter) {
    if(!character) return
    let name = ""
    const bot = aiBots.find(v => v.character === character)
    if(bot) name = bot.name
    return name
  }

  static async updateAiChat(id: string, data: Partial<Table_AiChat>) {
    if(!data.updatedStamp) data.updatedStamp = getNowStamp()
    const cCol = db.collection("AiChat")
    const res = await cCol.doc(id).update(data)
    return res
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
      this._fillWxGzhKf(obj1, from, fromCharacter)
      const res1 = await this._sendToWxGzh(wx_gzh_openid, obj1)
      return res1
    }

  }

  static async image(
    entry: AiEntry,
    imageUrl: string,
    from?: AiBot,
    fromCharacter?: AiCharacter,
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
      this._fillWxGzhKf(obj2, from, fromCharacter)
      const res2 = await this._sendToWxGzh(wx_gzh_openid, obj2)
      return res2
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

  private static _fillWxGzhKf(
    obj: Wx_Gzh_Send_Msg,
    bot?: AiBot,
    character?: AiCharacter,
  ) {
    const kf_account = this._getWxGzhKfAccount(bot, character)
    if(kf_account) {
      obj.customservice = { kf_account }
    }
  }

  private static _getWxGzhKfAccount(
    bot?: AiBot,
    character?: AiCharacter,
  ) {
    let c = bot?.character ?? character
    if(!c) return

    const _env = process.env
    if(c === "baixiaoying") {
      return _env.LIU_WXGZH_KF_BAIXIAOYING
    }
    else if(c === "deepseek") {
      return _env.LIU_WXGZH_KF_DEEPSEEK
    }
    else if(c === "hailuo") {
      return _env.LIU_WXGZH_KF_HAILUO
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

class TransformText {

  static handlefromAssistantChoice(choice: OaiChoice) {
    // 1. get text
    if(choice.finish_reason !== "stop") return
    const { message } = choice
    let text = message.content
    if(!text) return
    const originalText = text.trim()

    // 2. for shape 1
    const res2 = this._turnIntoTool_1(choice, originalText)
    if(res2) return true

    // 3. for shape 2
    const res3 = this._turnIntoTool_2(choice, originalText)
    if(res3) return true

    // 4. for shape 3
    const res4 = this._turnIntoTool_3(choice, originalText)
    if(res4) return true
  }

  private static _fillChoiceWithToolCall(
    choice: OaiChoice, 
    toolName: string,
    toolArgs: string,
  ) {
    const toolCall: OaiToolCall = {
      "type": "function",
      "function": {
        "name": toolName,
        "arguments": toolArgs,
      },
      "id": `call_${createRandom(5)}`,
    }
    choice.message.content = ""
    choice.message.tool_calls = [toolCall]
    choice.finish_reason = "tool_calls"
    return toolCall
  }

  /**
   * change shape like:
   * 
   * function draw_picture
   * ```json
   * {"prompt": "......"}
   * ```
   * 
   * into tool call
   */
  private static _turnIntoTool_3(
    choice: OaiChoice,
    text: string,
  ) {
    // 1. check if the text starts with "function"
    let index1 = -1
    let thePrefix1 = ""
    const prefix1s = ["function ", "function: "]
    for(let i=0; i<prefix1s.length; i++) {
      const v = prefix1s[i]
      index1 = text.indexOf(v)
      if(index1 >= 0) {
        thePrefix1 = v
        break
      }
    }
    if(!thePrefix1) return

    // 2. get toolName
    text = text.substring(index1 + thePrefix1.length).trimStart()
    const tmpList2 = text.split("\n")
    if(!tmpList2 || tmpList2.length < 2) return
    const toolName = tmpList2[0].trim()
    if(!toolName) return
    const hasTheTool = aiTools.find(v => v.function?.name === toolName)
    if(!hasTheTool) return

    // 3. check if the rest of the text starts with ```json
    tmpList2.shift()
    text = tmpList2.join("\n").trim()
    const prefix3s = ["```json", "```JSON"]
    const thePrefix3 = prefix3s.find(v => text.startsWith(v))
    if(!thePrefix3) return

    // 4. check if the rest of the text ends with ```
    text = text.substring(thePrefix3.length).trimStart()
    if(!text.endsWith("```")) return
    text = text.substring(0, text.length - 3).trimEnd()

    // 5. handle toolArgs
    let toolArgs = ""
    try {
      toolArgs = JSON.stringify(text)
    }
    catch(err) {
      console.warn("_turnIntoTool_3 err when stringify: ")
      console.log(err)
      return
    }

    // 6. let's transform!
    const toolCall = this._fillChoiceWithToolCall(choice, toolName, toolArgs)
    console.warn("success to turnIntoTool_3: ")
    console.log(toolCall)
    return true
  }

  /**
   * change shape like:
   * 
   * {
   *   "name": "draw_picture",
   *   "parameters": {...}
   * }
   * 
   * into tool call
   */
  private static _turnIntoTool_2(
    choice: OaiChoice,
    text: string,
  ) {
    // 1. start and end with
    const startMatched = text.startsWith("{")
    const endMatched = text.endsWith("}")
    if(!startMatched || !endMatched) return

    // 2. get toolName and tmpArgs
    let toolName = ""
    let tmpArgs: unknown
    try {
      const obj = JSON.parse(text)
      if(!obj) return
      toolName = obj.name
      if(obj["parameters"]) {
        tmpArgs = obj["parameters"]
      }
      if(obj["arguments"]) {
        tmpArgs = obj["arguments"]
      }
    }
    catch(err) {
      console.warn("_turnIntoTool_2 err: ")
      console.log(err)
      return
    }
    if(!toolName || !tmpArgs) return

    // 3. check if toolName exists
    const hasTheTool = aiTools.find(v => v.function?.name === toolName)
    if(!hasTheTool) return

    // 4. handle toolArgs
    let toolArgs = ""
    if(typeof tmpArgs === "string") {
      let tmp4 = tmpArgs.trim()
      try {
        JSON.parse(tmp4)
      }
      catch(err) {
        console.warn("JSON.parse(tmp4) error: ")
        console.log(err)
        return
      }
      toolArgs = tmp4
    }
    else if(typeof tmpArgs === "object") {
      try {
        toolArgs = JSON.stringify(tmpArgs)
      }
      catch(err) {
        console.warn("JSON.stringify(tmpArgs) error: ")
        console.log(err)
      }
    }
    if(!toolArgs) return

    
    const toolCall = this._fillChoiceWithToolCall(choice, toolName, toolArgs)
    console.warn("success to turnIntoTool_2: ")
    console.log(toolCall)
    return true
  }

  /**
   * change shape like:
   * 
   * 调用工具: xxx
   * 参数: xxxxxx
   * 
   * into tool call
   */
  private static _turnIntoTool_1(
    choice: OaiChoice,
    text: string,
  ) {
    // 1. check if the text starts with "调用工具"
    let index1 = -1
    let thePrefix1 = ""
    const prefix1s = ["调用工具:", "調用工具:", "Call a tool:"]
    for(let i=0; i<prefix1s.length; i++) {
      const v = prefix1s[i]
      index1 = text.indexOf(v)
      if(index1 >= 0) {
        thePrefix1 = v
        break
      }
    }
    if(!thePrefix1) return

    // 2. get toolName
    text = text.substring(index1 + thePrefix1.length).trimStart()
    const tmpList2 = text.split("\n")
    if(!tmpList2 || tmpList2.length < 2) return
    const toolName = tmpList2[0].trim()
    if(!toolName) return
    const hasTheTool = aiTools.find(v => v.function?.name === toolName)
    if(!hasTheTool) return

    // 3. check if the rest of the text starts with "参数"
    tmpList2.shift()
    text = tmpList2.join("\n").trim()
    const prefix3s = ["参数:", "參數:", "Arguments:"]
    const thePrefix3 = prefix3s.find(v => text.startsWith(v))
    if(!thePrefix3) return

    // 4. get args
    text = text.substring(thePrefix3.length).trimStart()
    let toolArgs = text.split("\n")[0]
    if(!toolArgs) return
    toolArgs = toolArgs.trim()
    try {
      const args = JSON.parse(toolArgs)
      console.warn("see args in _turnIntoTool: ")
      console.log(args)
    }
    catch(err) {
      console.warn("TransformText _turnIntoTool err: ")
      console.log(err)
      return
    }

    // 5. let's transform!
    const toolCall = this._fillChoiceWithToolCall(choice, toolName, toolArgs)
    console.warn("success to turnIntoTool_1: ")
    console.log(toolCall)
    return true
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
    let apiEndpoint: AiApiEndpoint | undefined
    const bot = this._bot
    const canUseChat = bot?.abilities.includes("chat")
    if(canUseChat && bot) {
      apiEndpoint = AiHelper.getApiEndpointFromBot(bot)
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
    const translatedText = AiHelper.getTextFromLLM(res3, this._bot)
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


class SpeechToText {

  static async runFromBlob(file_blob: Blob) {
    // 1. get apiKey, baseUrl, and request url
    const _env = process.env
    const apiKey = _env.LIU_SILICONFLOW_API_KEY
    const baseUrl = _env.LIU_SILICONFLOW_BASE_URL
    if(!apiKey || !baseUrl) {
      console.warn("no apiKey or baseUrl in SpeechToText")
      return
    }
    const url = baseUrl + "/audio/transcriptions"

    // 2. turn blob to formData
    const arrayBuffer = await file_blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const form = new FormData()
    try {
      console.log("add buffer......")
      form.append("file", buffer)
      form.append("model", "FunAudioLLM/SenseVoiceSmall")
    }
    catch(err) {
      console.warn("FormData append err: ")
      console.log(err)
    }

    // 3. options
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": 'multipart/form-data'
    }

    // 4. axios.post
    try {
      const res4 = await axios.post(url, form, { headers })
      console.log("see axios.post res4: ")
      console.log(res4.data)
    }
    catch(err) {
      console.warn("SpeechToText axios.post err: ")
      console.log(err)
    }

    // const options = {
    //   method: "POST",
    //   headers,
    //   body: form,
    // }

    // // 4. to fetch (or axios.post)
    // const s1 = getNowStamp()
    // const res4 = await liuFetch(url, options as any)
    // const s2 = getNowStamp()

    // const diffStamp = s2 - s1
    // console.log("耗时: ", diffStamp)
    // console.warn("SpeechToText res4: ")
    // console.log(res4)
  }

}
