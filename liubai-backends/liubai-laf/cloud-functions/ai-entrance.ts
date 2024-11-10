// Function Name: ai-entrance

import type { 
  AiBot,
  AiCharacter,
  AiUsage,
  Partial_Id, 
  Table_AiChat, 
  Table_AiRoom, 
  Table_User, 
  Wx_Gzh_Send_Msg,
} from "@/common-types"
import OpenAI from "openai"
import { 
  checkAndGetWxGzhAccessToken, 
  checkIfUserSubscribed, 
  getDocAddId,
  valTool,
} from "@/common-util"
import { sendWxMessage } from "@/service-send"
import { getBasicStampWhileAdding, getNowStamp } from "@/common-time"
import { aiBots } from "@/ai-prompt"
import cloud from "@lafjs/cloud"

const db = cloud.database()

/********************* constants ***********************/
const MAX_CHARACTERS = 3
const MAX_TOKEN_1 = 8000
const TOKEN_NEED_COMPRESS = 6000

/************************** types ************************/

export interface AiEntrance {
  user: Table_User
  text?: string
  wx_gzh_openid?: string
}

interface HistoryData {
  results: Table_AiChat[]    // desc by insertedStamp
  totalToken: number
}

// pass it to aiController.run() and bot.run()
interface AiRunParam {
  entry: AiEntrance
  room: Table_AiRoom
  chatId: string
  historyData: HistoryData
}

interface AiRunSuccess {
  assistantChatId: string
  chatCompletion?: OpenAI.Chat.ChatCompletion
}

interface HelperAssistantMsgParam {
  roomId: string
  text?: string
  model: string
  character: AiCharacter
  usage?: AiUsage
  requestId?: string
  baseUrl?: string
}

/********************* empty function ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with ai-entrance")
  return true
}


export async function enter_ai(
  entry: AiEntrance,
) {

  // 1. check out text
  const text = entry.text
  if(!text) return

  // 2. check out directive
  const isDirective = AiDirective.check(entry)
  if(isDirective) return

  // 3. check out quota
  const isQuotaEnough = await AiHelper.checkQuota(entry)
  if(!isQuotaEnough) return

  // 4. get my ai room
  const room = await AiHelper.getMyAiRoom(entry)
  if(!room) return
  const roomId = room._id

  // 5. add the current message into db
  const chatId = await AiHelper.addUserMsg(entry, roomId)
  if(!chatId) return

  // 6. get latest chat records
  const res6 = await AiHelper.getLatestChat(roomId)

  // 7. run AI!
  const controller = new AiController()
  controller.run({ entry, room, chatId, historyData: res6 })


}


/** check out if it's a directive, like "召唤..." */
class AiDirective {

  static check(entry: AiEntrance) {

    // 1. get text
    const text = entry.text
    if(!text) return false

    // 2. is it a kick directive?
    const text2 = text.trim().replace("+", " ")
    const botKicked = this.isKickBot(text2)
    if(botKicked) {
      this.toKickBot(entry, botKicked)
      return true
    }

    // 3. is it an adding directive?
    const botAdded = this.isAddBot(text2)
    if(botAdded) {
      this.toAddBot(entry, botAdded)
      return true
    }

    // 4. is it clear directive?
    const res4 = this.isClear(text2)
    if(res4) {
      this.toClear(entry)
      return true
    }

    return false
  }

  private static async toKickBot(entry: AiEntrance, bot: AiBot) {

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

    // 4. WIP: send a message to user

    return res3    
  }

  private static async toAddBot(entry: AiEntrance, bot: AiBot) {
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

    // 5. WIP: send a message to user

    console.log("toAddBot res4: ")
    console.log(res4)

    return true
  }

  private static isKickBot(text: string) {
    const prefix = ["踢掉", "移除"]
    let prefixMatched = prefix.find(v => text.startsWith(v))
    if(!prefixMatched) return

    const otherText = text.substring(prefixMatched.length).trim()
    const botMatched = aiBots.find(v => {
      if(v.name === otherText) return true
      if(v.alias.includes(otherText)) return true
      return false
    })

    return botMatched
  }

  private static isAddBot(text: string) {
    const prefix = ["召唤", "添加", "呼叫"]
    let prefixMatched = prefix.find(v => text.startsWith(v))
    if(!prefixMatched) return

    const otherText = text.substring(prefixMatched.length).trim()
    const botMatched = aiBots.find(v => {
      if(v.name === otherText) return true
      if(v.alias.includes(otherText)) return true
      return false
    })
    return botMatched
  }

  private static isClear(text: string) {
    const strs = ["清空上文", "清空上下文", "清楚历史记录"]
    return strs.includes(text)
  }

  private static async toClear(entry: AiEntrance) {
    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return false

    // 2. add a clear record into db
    const b2 = getBasicStampWhileAdding()
    const data2: Partial_Id<Table_AiChat> = {
      ...b2,
      msgType: "clear",
      roomId: room._id,
    }
    const col = db.collection("AiChat")
    const res2 = await col.add(data2)
    console.log("toClear res2: ")
    console.log(res2)

    // 3. WIP: send a clear message to user

    return true
  }

}



/**************************** Bots ***************************/

class BotZeroOne {

  private _client: OpenAI | undefined
  private _character: AiCharacter = "wanzhi"
  private _baseUrl: string | undefined

  constructor() {
    const _env = process.env
    const apiKey = _env.LIU_YI_API_KEY
    const baseURL = _env.LIU_YI_BASE_URL
    this._baseUrl = baseURL
    try {
      this._client = new OpenAI({ apiKey, baseURL })
    } catch(err) {
      console.warn("yi constructor gets client error: ")
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
      console.log(`yi chat cost: ${cost}ms`)
      // console.log(chatCompletion)
      return chatCompletion as OpenAI.Chat.ChatCompletion
    }
    catch(err) {
      console.warn("yi chat error: ")
      console.log(err)
    }
  }

  async run(param: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. get history data & model
    const { historyData, room, chatId, entry } = param
    const roomId = room._id
    const chats = historyData.results
    let totalToken = historyData.totalToken
    const bot = this.getSuitableBot()
    if(!bot) return
    const model = bot.model
    // console.log("yi model: ", model)

    // 2. add system prompt

    // 3. turn chats into prompt
    const prompts = AiHelper.turnChatsIntoPrompt(chats)
    prompts.reverse()

    // console.log("yi prompts: ")
    // console.log(prompts)

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0])

    // 5. to chat
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
    }
    const res5 = await this.chat(params)
    if(!res5) return
    console.log("yi res5.choices[0]: ")
    console.log(res5.choices[0])

    // 6. get content, add now we only support text
    let txt6 = res5.choices[0].message.content
    if(!txt6) return
    txt6 = txt6.trimStart()

    // 7. can i reply
    const res7 = await AiHelper.canReply(roomId, chatId)
    if(!res7) return

    // 8. reply
    TellUser.text(entry, txt6, bot)

    // 9. add assistant chat
    const param9: HelperAssistantMsgParam = {
      roomId,
      text: txt6,
      model,
      character: this._character,
      usage: res5.usage,
      requestId: res5.id,
      baseUrl: this._baseUrl,
    }
    const assistantChatId = await AiHelper.addAssistantMsg(param9)
    if(!assistantChatId) return

    return { chatCompletion: res5, assistantChatId }
  }


  private getSuitableBot() {
    const c = this._character
    const bots = aiBots.filter(v => v.character === c)
    if(bots.length < 1) {
      console.warn("no bot for yi can be used")
      return
    }
    return bots[0]
  }

}

class BotMoonshot {

  private _client: OpenAI | undefined
  private _character: AiCharacter = "kimi"
  private _baseUrl: string | undefined

  constructor() {
    const _env = process.env
    const apiKey = _env.LIU_MOONSHOT_API_KEY
    const baseURL = _env.LIU_MOONSHOT_BASE_URL
    this._baseUrl = baseURL
    try {
      this._client = new OpenAI({ apiKey, baseURL })
    } catch(err) {
      console.warn("ZeroOne constructor gets client error: ")
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
      console.log(`moonshot chat cost: ${cost}ms`)
      // console.log(chatCompletion)
      return chatCompletion as OpenAI.Chat.ChatCompletion
    }
    catch(err) {
      console.warn("moonshot chat error: ")
      console.log(err)
    }
  }

  async run(param: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. get history data & model
    const { historyData, room, chatId, entry } = param
    const roomId = room._id
    const chats = historyData.results
    let totalToken = historyData.totalToken
    const bot = this.getSuitableBot()
    if(!bot) return
    const model = bot.model
    // console.log("moonshot model: ", model)

    // 2. add system prompt

    // 3. turn chats into prompt
    const prompts = AiHelper.turnChatsIntoPrompt(chats)
    prompts.reverse()

    // console.log("moonshot prompts: ")
    // console.log(prompts)

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0])

    // 5. to chat
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
    }
    const res5 = await this.chat(params)
    if(!res5) return
    console.log("moonshot res5.choices[0]: ")
    console.log(res5.choices[0])

    // 6. get content, add now we only support text
    let txt6 = res5.choices[0].message.content
    if(!txt6) return
    txt6 = txt6.trimStart()

    // 7. can i reply
    const res7 = await AiHelper.canReply(roomId, chatId)
    if(!res7) return

    // 8. reply
    TellUser.text(entry, txt6, bot)

    // 9. add assistant chat
    const param9: HelperAssistantMsgParam = {
      roomId,
      text: txt6,
      model,
      character: this._character,
      usage: res5.usage,
      requestId: res5.id,
      baseUrl: this._baseUrl,
    }
    const assistantChatId = await AiHelper.addAssistantMsg(param9)
    if(!assistantChatId) return

    return { chatCompletion: res5, assistantChatId }
  }


  private getSuitableBot() {
    const c = this._character
    const bots = aiBots.filter(v => v.character === c)
    if(bots.length < 1) {
      console.warn("no bot for moonshot can be used")
      return
    }
    return bots[0]
  }

}

class BotDeepSeek {

  private _client: OpenAI | undefined
  private _character: AiCharacter = "deepseek"
  private _baseUrl: string | undefined

  constructor() {
    const _env = process.env
    const apiKey = _env.LIU_DEEPSEEK_API_KEY
    const baseURL = _env.LIU_DEEPSEEK_BASE_URL
    this._baseUrl = baseURL
    try {
      this._client = new OpenAI({ apiKey, baseURL })
    } catch(err) {
      console.warn("DeepSeek constructor gets client error: ")
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
      console.log(`deepseek chat cost: ${cost}ms`)
      // console.log(chatCompletion)
      return chatCompletion as OpenAI.Chat.ChatCompletion
    }
    catch(err) {
      console.warn("deepseek chat error: ")
      console.log(err)
    }
  }

  async run(param: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. get history data & model
    const { historyData, room, chatId, entry } = param
    const roomId = room._id
    const chats = historyData.results
    let totalToken = historyData.totalToken
    const bot = this.getSuitableBot()
    if(!bot) return
    const model = bot.model

    // console.log("deepseek model: ", model)

    // 2. add system prompt

    // 3. turn chats into prompt
    const prompts = AiHelper.turnChatsIntoPrompt(chats)
    prompts.reverse()
    // console.log("deepseek prompts: ")
    // console.log(prompts)

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0])

    // 5. to chat
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
    }
    const res5 = await this.chat(params)
    if(!res5) return
    console.log("deepseek res5.choices[0]: ")
    console.log(res5.choices[0])

    // 6. get content, add now we only support text
    let txt6 = res5.choices[0].message.content
    if(!txt6) return
    txt6 = txt6.trimStart()

    // 7. can i reply
    const res7 = await AiHelper.canReply(roomId, chatId)
    if(!res7) return

    // 8. reply
    TellUser.text(entry, txt6, bot)

    // 9. add assistant chat
    const param9: HelperAssistantMsgParam = {
      roomId,
      text: txt6,
      model,
      character: this._character,
      usage: res5.usage,
      requestId: res5.id,
      baseUrl: this._baseUrl,
    }
    const assistantChatId = await AiHelper.addAssistantMsg(param9)
    if(!assistantChatId) return

    return { chatCompletion: res5, assistantChatId }
  }

  private getSuitableBot() {
    const c = this._character
    const bots = aiBots.filter(v => v.character === c)
    if(bots.length < 1) {
      console.warn("no bot for deepseek can be used")
      return
    }
    return bots[0]
  }

}

class BotStepfun {

  private _client: OpenAI | undefined
  private _character: AiCharacter = "yuewen"
  private _baseUrl: string | undefined

  constructor() {
    const _env = process.env
    const apiKey = _env.LIU_STEPFUN_API_KEY
    const baseURL = _env.LIU_STEPFUN_BASE_URL
    this._baseUrl = baseURL
    try {
      this._client = new OpenAI({ apiKey, baseURL })
    } catch(err) {
      console.warn("Stepfun constructor gets client error: ")
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
      console.log(`stepfun chat cost: ${cost}ms`)
      // console.log(chatCompletion)
      return chatCompletion as OpenAI.Chat.ChatCompletion
    }
    catch(err) {
      console.warn("stepfun chat error: ")
      console.log(err)
    }
  }

  async run(param: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. get history data & model
    const { historyData, room, chatId, entry } = param
    const roomId = room._id
    const chats = historyData.results
    let totalToken = historyData.totalToken
    const bot = this.getSuitableBot()
    if(!bot) return
    const model = bot.model

    // console.log("stepfun model: ", model)

    // 2. add system prompt

    // 3. turn chats into prompt
    const prompts = AiHelper.turnChatsIntoPrompt(chats)
    prompts.reverse()
    // console.log("stepfun prompts: ")
    // console.log(prompts)

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0])

    // 5. to chat
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
    }
    const res5 = await this.chat(params)
    if(!res5) return
    console.log("stepfun res5.choices[0]: ")
    console.log(res5.choices[0])

    // 6. get content, add now we only support text
    let txt6 = res5.choices[0].message.content
    if(!txt6) return
    txt6 = txt6.trimStart()

    // 7. can i reply
    const res7 = await AiHelper.canReply(roomId, chatId)
    if(!res7) return

    // 8. reply
    TellUser.text(entry, txt6, bot)

    // 9. add assistant chat
    const param9: HelperAssistantMsgParam = {
      roomId,
      text: txt6,
      model,
      character: this._character,
      usage: res5.usage,
      requestId: res5.id,
      baseUrl: this._baseUrl,
    }
    const assistantChatId = await AiHelper.addAssistantMsg(param9)
    if(!assistantChatId) return

    return { chatCompletion: res5, assistantChatId }
  }

  private getSuitableBot() {
    const c = this._character
    const bots = aiBots.filter(v => v.character === c)
    if(bots.length < 1) {
      console.warn("no bot for stepfun can be used")
      return
    }
    return bots[0]
  }


}

class BotZhipu {

  private _client: OpenAI | undefined
  private _character: AiCharacter = "zhipu"
  private _baseUrl: string | undefined

  constructor() {
    const _this = this
    const _env = process.env
    const apiKey = _env.LIU_ZHIPU_API_KEY
    const baseURL = _env.LIU_ZHIPU_BASE_URL
    _this._baseUrl = baseURL
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
      // console.log(chatCompletion)
      return chatCompletion as OpenAI.Chat.ChatCompletion
    }
    catch(err) {
      console.warn("zhipu chat error: ")
      console.log(err)
    }
  }

  async run(param: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. get history data & model
    const { historyData, room, chatId, entry } = param
    const roomId = room._id
    const chats = historyData.results
    let totalToken = historyData.totalToken
    const bot = this.getSuitableBot()
    if(!bot) return
    const model = bot.model

    // console.log("Zhipu model: ", model)

    // 2. add system prompt

    // 3. turn chats into prompt
    const prompts = AiHelper.turnChatsIntoPrompt(chats)
    prompts.reverse()
    // console.log("zhipu prompts: ")
    // console.log(prompts)

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0])

    // 5. to chat
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages: prompts,
      max_tokens: maxToken,
      model,
    }
    const res5 = await this.chat(params)
    if(!res5) return
    console.log("zhipu res5.choices[0]: ")
    console.log(res5.choices[0])

    // 6. get content, add now we only support text
    let txt6 = res5.choices[0].message.content
    if(!txt6) return
    txt6 = txt6.trimStart()

    // 7. can i reply
    const res7 = await AiHelper.canReply(roomId, chatId)
    if(!res7) return

    // 8. reply
    TellUser.text(entry, txt6, bot)

    // 9. add assistant chat
    const param9: HelperAssistantMsgParam = {
      roomId,
      text: txt6,
      model,
      character: this._character,
      usage: res5.usage,
      requestId: res5.id,
      baseUrl: this._baseUrl,
    }
    const assistantChatId = await AiHelper.addAssistantMsg(param9)
    if(!assistantChatId) return

    return { chatCompletion: res5, assistantChatId }
  }

  private getSuitableBot() {
    const c = this._character
    const bots = aiBots.filter(v => v.character === c)
    if(bots.length < 1) {
      console.warn("no bot for zhipu can be used")
      return
    }
    return bots[0]
  }

}


/*********************** AI Controller ************************/
class AiController {

  async run(param: AiRunParam) {
    const { room, historyData, entry } = param

    // 1. check bots in the room
    let characters = room.characters
    characters = characters.filter(c => AiHelper.isCharacterAvailable(c))
    if(characters.length < 1) {
      console.warn("no available characters in the room")
      return false
    }

    // 2. compress history data
    let promptToken = historyData.totalToken
    let chats = historyData.results
    if(promptToken > TOKEN_NEED_COMPRESS) {
      // WIP: compress
      // ......

      // 2.1 update the history data

    }

    // 3. get promises
    const promises: Promise<AiRunSuccess | undefined>[] = []
    for(let i=0; i<characters.length; i++) {
      const c = characters[i]
      if(c === "deepseek") {
        const bot1 = new BotDeepSeek()
        const pro1 = bot1.run(param)
        promises.push(pro1)
      }
      else if(c === "kimi") {
        const bot2 = new BotMoonshot()
        const pro2 = bot2.run(param)
        promises.push(pro2)
      }
      else if(c === "wanzhi") {
        const bot3 = new BotZeroOne()
        const pro3 = bot3.run(param)
        promises.push(pro3)
      }
      else if(c === "yuewen") {
        const bot4 = new BotStepfun()
        const pro4 = bot4.run(param)
        promises.push(pro4)
      }
      else if(c === "zhipu") {
        const bot5 = new BotZhipu()
        const pro5 = bot5.run(param)
        promises.push(pro5)
      }
    }

    // 4. wait for all promises
    const res4 = await Promise.all(promises)
    let hasEverSucceeded = false
    for(let i=0; i<res4.length; i++) {
      const v = res4[i]
      if(v) {
        hasEverSucceeded = true
      }
    }
    if(!hasEverSucceeded) return

    // 5. add quota for user
    const num5 = AiHelper.addQuotaForUser(entry)
    if((num5 % 3) === 2) {
      // WIP: send menu, which is a toolbox

    }

  }


}



/*********************** helper functions ************************/

class AiHelper {

  static async getMyAiRoom(
    entry: AiEntrance,
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

  private static getAvailableCharacters() {
    const characters: AiCharacter[] = []
    const _env = process.env

    for(let i=0; i<aiBots.length; i++) {
      const bot = aiBots[i]
      const c = bot.character
      if(characters.includes(c)) continue
      const p = bot.provider
      if(p === "zhipu") {
        if(_env.LIU_ZHIPU_API_KEY && _env.LIU_ZHIPU_BASE_URL) {
          characters.push(c)
        }
      }
      else if(p === "moonshot") {
        if(_env.LIU_MOONSHOT_API_KEY && _env.LIU_MOONSHOT_BASE_URL) {
          characters.push(c)
        }
      }
      else if(p === "deepseek") {
        if(_env.LIU_DEEPSEEK_API_KEY && _env.LIU_DEEPSEEK_BASE_URL) {
          characters.push(c)
        }
      }
      else if(p === "stepfun") {
        if(_env.LIU_STEPFUN_API_KEY && _env.LIU_STEPFUN_BASE_URL) {
          characters.push(c)
        }
      }
      else if(p === "zero-one") {
        if(_env.LIU_YI_API_KEY && _env.LIU_YI_BASE_URL) {
          characters.push(c)
        }
      }
    }

    return characters
  }


  static async checkQuota(
    entry: AiEntrance,
  ) {
    const user = entry.user
    const quota = user.quota
    if(!quota) return true

    const count = quota.aiConversationCount
    const isSubscribed = checkIfUserSubscribed(user)
    const MAX_TIMES = isSubscribed ? 200 : 10

    const available = count < MAX_TIMES
    if(!available) {
      // WIP: send message to user: "please upgrade your subscription to continue"

    }

    return available
  }

  static async addUserMsg(
    entry: AiEntrance,
    roomId: string,
  ) {
    const text = entry.text
    const userId = entry.user._id
    const b1 = getBasicStampWhileAdding()
    const data1: Partial_Id<Table_AiChat> = {
      ...b1,
      roomId,
      msgType: "user",
      text,
      userId,
      channel: "wx_gzh",
    }
    const col = db.collection("AiChat")
    const res1 = await col.add(data1)
    const chatId = getDocAddId(res1)
    if(!chatId) {
      console.warn("cannot get chatId while adding user msg error")
      console.log(res1)
      console.log("entry: ")
      console.log(entry)
      return
    }

    return chatId
  }

  static async addAssistantMsg(
    param: HelperAssistantMsgParam,
  ) {
    const b1 = getBasicStampWhileAdding()
    const data1: Partial_Id<Table_AiChat> = {
      ...b1,
      roomId: param.roomId,
      msgType: "assistant",
      text: param.text,
      model: param.model,
      character: param.character,
      usage: param.usage,
      requestId: param.requestId,
      baseUrl: param.baseUrl,
    }
    const col = db.collection("AiChat")
    const res1 = await col.add(data1)
    const chatId = getDocAddId(res1)
    if(!chatId) {
      console.warn("adding assistant msg error")
      console.log(res1)
      return
    }
    return chatId
  }

  static async getLatestChat(
    roomId: string,
  ): Promise<HistoryData> {
    const _this = this
    const col = db.collection("AiChat")
    const q1 = col.where({ roomId }).orderBy("insertedStamp", "desc")
    const res1 = await q1.limit(50).get<Table_AiChat>()
    const chats = res1.data
    const results: Table_AiChat[] = []
    let totalToken = 0
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      if(v.msgType === "clear") {
        break
      }
      const token = _this.calculateToken(v)
      const tmpToken = totalToken + token
      if(tmpToken > MAX_TOKEN_1) {
        break
      }
      totalToken = tmpToken
      results.push(v)

      if(v.msgType === "summary") {
        break
      }
    }

    return { results, totalToken }
  }

  static calculateToken(
    chat: Table_AiChat,
  ) {
    const { msgType, usage, text, imageUrl } = chat
    if(msgType === "assistant" || msgType === "summary") {
      const token1 = usage?.completion_tokens
      if(token1) return token1
    }

    let token = 0
    if(text) {
      for(let i=0; i<text.length; i++) {
        const char = text[i]
        if(valTool.isLatinChar(char)) {
          token += 0.5
        }
        else {
          token += 1
        }
      }
    }
    else if(imageUrl) {
      token += 400
    }

    return token
  }

  static async canReply(
    roomId: string,
    chatId: string,
  ) {
    const col = db.collection("AiChat")
    const q1 = col.where({ roomId }).orderBy("insertedStamp", "desc")
    const res1 = await q1.limit(10).get<Table_AiChat>()
    const chats = res1.data

    let res = false
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      if(v.msgType === "user") {
        res = v._id === chatId
        break
      }
      if(v.msgType === "clear") {
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


  static turnChatsIntoPrompt(chats: Table_AiChat[]) {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      const { msgType, text, imageUrl, character } = v
      if(msgType === "user") {
        if(text) {
          messages.push({ role: "user", content: text })
        }
        else if(imageUrl) {
          messages.push({ 
            role: "user", 
            content: [{ type: "image_url", image_url: { url: imageUrl } }]
          })
        }
      }
      else if(msgType === "assistant") {
        if(text) {
          messages.push({ role: "assistant", content: text, name: character })
        }
      }
      else if(msgType === "background" || msgType === "summary") {
        if(text) {
          messages.push({ role: "system", content: text })
        }
      }
    }

    return messages
  }

  static getMaxToken(
    totalToken: number,
    firstChat: Table_AiChat,
  ) {
    const restToken = MAX_TOKEN_1 - totalToken
    const firstToken = this.calculateToken(firstChat)
    let maxTokens = firstToken * 2
    if(maxTokens < 280) maxTokens = 280
    if(maxTokens > restToken) maxTokens = restToken
    return maxTokens
  }

  static addQuotaForUser(entry: AiEntrance) {
    // 1. add
    const user = entry.user
    const userId = user._id
    const quota = user.quota ?? { aiConversationCount: 0 }
    quota.aiConversationCount += 1

    // 2. update
    const u2: Partial<Table_User> = {
      quota,
      updatedStamp: getNowStamp(),
    }
    const uCol = db.collection("User")
    uCol.doc(userId).update(u2)
    
    return quota.aiConversationCount
  }


}



class TellUser {

  static async text(
    entry: AiEntrance, 
    text: string,
    from?: AiBot,
  ) {
    const { wx_gzh_openid } = entry

    // 1. send to wx gzh
    if(wx_gzh_openid) {
      const obj1: Wx_Gzh_Send_Msg = {
        msgtype: "text",
        text: { content: text },
      }
      if(from?.wx_gzh_kf_account) {
        obj1.customservice = { kf_account: from.wx_gzh_kf_account }
      }
      const res1 = await this.sendToWxGzh(wx_gzh_openid, obj1)
      return res1
    }

    

  }


  private static async sendToWxGzh(
    wx_gzh_openid: string,
    obj: Wx_Gzh_Send_Msg,
  ) {
    const accessToken = await checkAndGetWxGzhAccessToken()
    if(!accessToken) return
    const res = await sendWxMessage(wx_gzh_openid, accessToken, obj)
    return res
  }

}
