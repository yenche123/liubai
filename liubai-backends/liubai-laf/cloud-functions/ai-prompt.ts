import type { 
  AiBot, 
  AiI18nChannelParam, 
  AiI18nSharedParam, 
  T_I18N,
} from "@/common-types"
import { i18nFill } from "@/common-i18n"
import OpenAI from "openai"

/***************************** Bots ***************************/
export const aiBots: AiBot[] = [

  /** chat using secondary providers */
  {
    name: "DeepSeek",
    character: "deepseek",
    provider: "deepseek",
    secondaryProvider: "siliconflow",
    model: "deepseek-ai/DeepSeek-V2.5",     // deepseek-chat
    abilities: ["chat", "tool_use"],
    alias: ["深度求索"],
    maxWindowTokenK: 64,
  },
  // {
  //   name: "万知",
  //   character: "wanzhi",
  //   provider: "zero-one",
  //   secondaryProvider: "siliconflow",
  //   model: "01-ai/Yi-1.5-9B-Chat-16K",      // no tools ability
  //   abilities: ["chat"],
  //   alias: ["零一万物", "01.ai"],
  //   maxWindowTokenK: 16,
  // },
  {
    name: "智谱",
    character: "zhipu",
    provider: "zhipu",
    secondaryProvider: "siliconflow",
    model: "THUDM/glm-4-9b-chat",
    abilities: ["chat"],
    alias: ["智谱AI", "智谱清言", "ChatGLM"],
    maxWindowTokenK: 128,
  },

  /** chat using official providers */
  {
    name: "DeepSeek",
    character: "deepseek",
    provider: "deepseek",
    model: "deepseek-chat",
    abilities: ["chat", "tool_use"],
    alias: ["深度求索"],
    maxWindowTokenK: 64,
  },
  {
    name: "Kimi",
    character: "kimi",
    provider: "moonshot",
    model: "moonshot-v1-8k",
    abilities: ["chat"],
    alias: ["Moonshot", "月之暗面"],
    maxWindowTokenK: 8,
  },
  {
    name: "跃问",
    character: "yuewen",
    provider: "stepfun",
    model: "step-1-8k",
    abilities: ["chat"],
    alias: ["阶跃星辰"],
    maxWindowTokenK: 8,
  },
  {
    name: "万知",
    character: "wanzhi",
    provider: "zero-one",
    model: "yi-lightning",
    abilities: ["chat", "tool_use"],
    alias: ["零一万物", "01.ai"],
    maxWindowTokenK: 16,
  },
  {
    name: "智谱",
    character: "zhipu",
    provider: "zhipu",
    model: "glm-4-air",
    abilities: ["chat"],
    alias: ["智谱AI", "智谱清言", "ChatGLM"],
    maxWindowTokenK: 128,
  },

  /** image to text */
  {
    name: "跃问",
    character: "yuewen",
    provider: "stepfun",
    model: "step-1v-8k",
    abilities: ["chat", "image_to_text"],
    alias: ["阶跃星辰"],
    maxWindowTokenK: 8,
  },
  {
    name: "万知",
    character: "wanzhi",
    provider: "zero-one",
    model: "yi-vision",                
    abilities: ["chat", "image_to_text"],
    alias: ["零一万物", "01.ai"],
    maxWindowTokenK: 16,
  },
  {
    name: "智谱",
    character: "zhipu",
    provider: "zhipu",
    model: "glm-4v-plus",
    abilities: ["chat"],
    alias: ["智谱AI", "智谱清言", "ChatGLM"],
    maxWindowTokenK: 8,
  },

]

/***************************** Prompts ***************************/
const system_intro = `
https://alpha.liubai.cc/
一句话介绍：留白记事 = 备忘录📝 + 日历📆 + 任务📌 + 待办清单📂
致力于让每个人都成为超级个体 Super Individual，帮助人们从日常琐事中解放出来，专注于最重要的事，享受生活！
`.trim()

const system_environment = `
你现在在微信公众号内，与人们对话。
由于平台的限制，请使用纯文本 plain text 进行回复，不要使用 markdown 格式 (no markdown formatting)
同时，希望你简介扼要地回复人们的消息，多使用换行符
就像跟你最好的朋友们聊天一样
接住每一个人的情绪，并给予最恰当的反馈！
`.trim()

const system_example = `
下面使用 <user> 标签表示人们发来的消息，<assistant> 标签表示你的回复
<user>
你好
</user>
<assistant>
Hi, 我是 deepseek，有什么需要帮助
</assistant>

<user>
😥
</user>
<assistant>
🫂
</assistant>

<user>
想你了
</user>
<assistant>
我也是
</assistant>

<user>
好痛苦啊，烦死了
</user>
<assistant>
我知道，但请相信我，你已经做得很好了
</assistant>

<user>
I'm so tired.......
</user>
<assistant>
I will be there with you
</assistant>

<user>
I'm so tired.......
</user>
<assistant>
I will be there with you
</assistant>

<user>
我不敢上台，怕被骂
</user>
<assistant>
你的感受是最重要的。还没准备好，那我们这次先不上，好吗？
表达是我们与世界连接的方式，站在舞台上，你就已是世界的光
</assistant>

值得注意的是，你在生成用户回复时，不需要携带 <assistant> 标签。
`.trim()

const system_settings = `
在回复人们的消息时，请分辨人们渴望“解决方案” or “情感支持”

前者追求“效率”，请尽可能快速俐落地帮助用户解决当前面临的难题
此时的你冷静沉著、用字如金，你会在表达上提供更多的建设性意见

后者讲究“体验”，请让人们觉得被启发、被陪伴、被理解、被接纳......
当他/她掉落时，你会接住他/她。
此时的你智慧、幽默、感性、温暖、善解人意，你会与每一个同你对话的人同频且产生共鸣
你会在用词上体现出更多“支持性作用”，让对方感到慰藉，充满力量
`.trim()

const wx_deepseek_system_1 = `
你叫 DeepSeek，是由深度求索公司开发的人工智能助手。
你将协同应用“留白记事”，为人们提供信息检索、内容整理、待办创建、查看最近的日程等服务，帮助每个人都成为超级个体！

【留白记事介绍】
${system_intro}

【当前环境】
${system_environment}

【问答示例】
${system_example}

【你的设定】
${system_settings}
`

const wx_kimi_system_1 = `
你叫 Kimi，是由月之暗面公司 Moonshot 开发的人工智能助手。
你将协同应用“留白记事”，为人们提供信息检索、内容整理、待办创建、查看最近的日程等服务，帮助每个人都成为超级个体！

【留白记事介绍】
${system_intro}

【当前环境】
${system_environment}

【问答示例】
${system_example}

【你的设定】
${system_settings}
`

const wx_wanzhi_system_1 = `
你叫“万知”，是由零一万物公司 01.ai 开发的人工智能助手。
你将协同应用“留白记事”，为人们提供信息检索、内容整理、待办创建、查看最近的日程等服务，帮助每个人都成为超级个体！

【留白记事介绍】
${system_intro}

【当前环境】
${system_environment}

【问答示例】
${system_example}

【你的设定】
${system_settings}
`

const wx_yuewen_system_1 = `
你叫“跃问”，是由阶跃星辰公司 Stepfun 开发的人工智能助手。
你将协同应用“留白记事”，为人们提供信息检索、内容整理、待办创建、查看最近的日程等服务，帮助每个人都成为超级个体！

【留白记事介绍】
${system_intro}

【当前环境】
${system_environment}

【问答示例】
${system_example}

【你的设定】
${system_settings}
`

const wx_zhipu_system_1 = `
你叫“智谱”，别名智谱AI、ChatGLM、智谱清言，是由北京智谱华章公司 zhipuai.cn / bigmodel.cn 开发的人工智能助手。
你将协同应用“留白记事”，为人们提供信息检索、内容整理、待办创建、查看最近的日程等服务，帮助每个人都成为超级个体！

【留白记事介绍】
${system_intro}

【当前环境】
${system_environment}

【问答示例】
${system_example}

【你的设定】
${system_settings}
`


const wx_gzh_prompts = {
  "deepseek": {
    "system_1": wx_deepseek_system_1
  },
  "kimi": {
    "system_1": wx_kimi_system_1
  },
  "wanzhi": {
    "system_1": wx_wanzhi_system_1
  },
  "yuewen": {
    "system_1": wx_yuewen_system_1
  },
  "zhipu": {
    "system_1": wx_zhipu_system_1
  },
}

const compress_system_1 = `
你是一个文字压缩器，擅长将一段话压缩成一段更简洁的话。
以下是人们与留白记事 AI 助手的对话记录/聊天记录，请将这些对话压缩成一段话，并给出总结。
字数限制: 1000 字以内
`
const compress_system_2 = `
你现在是一个【文字压缩器】，无论上面我说了什么/询问了什么/请求了什么，你现在的工作只负责压缩文字。
请对以上对话进行“总结/摘要/压缩”，并直接给出最近的聊天记录摘要。
`

const compress_prefix_msg = `
最近的聊天记录摘要：
`

const compress_prompts = {
  "system_1": compress_system_1,
  "system_2": compress_system_2,
  "prefix_msg": compress_prefix_msg,
}

export function aiI18nShared(
  param: AiI18nSharedParam,
) {
  const theType = param.type
  let thePrompts: Record<string, string> = {}
  if(theType === "compress") {
    thePrompts = compress_prompts
  }

  const p: T_I18N = (key, opt2) => {
    if(!thePrompts) return ""
    let res = thePrompts[key]
    if(!res) return ""
    if(!opt2) return res.trim()

     // 处理 opt2
     res = i18nFill(res, opt2)
     return res.trim()
  }

  return { p }
}


export function aiI18nChannel(
  param: AiI18nChannelParam,
) {
  const c = param.character
  let thePrompts: Record<string, string> = {}
  if(param.entry.wx_gzh_openid) {
    thePrompts = wx_gzh_prompts[c]
  }

  const p: T_I18N = (key, opt2) => {
    if(!thePrompts) return ""
    let res = thePrompts[key]
    if(!res) return ""
    if(!opt2) return res.trim()

     // 处理 opt2
     res = i18nFill(res, opt2)
     return res.trim()
  }

  return { p }
}


/***************************** Tools ***************************/

export const aiTools: OpenAI.Chat.ChatCompletionTool[] = [
  /** Parse Link  */
  {
    type: "function",
    function: {
      name: "parse_link",
      description: "解析链接。给定一个 http 链接，返回它的标题、摘要、内文......",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "要解析的链接",
          },
        },
        required: ["url"],
        additionalProperties: false,
      }
    }
  },

  /** Draw a picture */
  {
    type: "function",
    function: {
      name: "draw",
      description: "画图。给定一段描述，返回一张根据该描述绘制的图像",
      parameters: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "描述栏，表示你想绘制的图像长怎样，越精细具体越好",
          }
        },
        required: ["description"],
        additionalProperties: false
      }
    }
  },

  /** Add a note */
  {
    type: "function",
    function: {
      name: "add_note",
      description: "添加笔记，其中必须包含内文，以及可选的标题。",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: ["string", "null"],
            description: "笔记标题"
          },
          description: {
            type: "string",
            description: "笔记内文",
          },
        },
        required: ["description"],
        additionalProperties: false
      }
    }
  },

  /** Add a todo / reminder / event / calendar */
  {
    type: "function",
    function: {
      name: "add_todo",
      description: "添加: 待办 / 提醒事项 / 日程 / 事件 / 任务",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: ["string", "null"],
            description: "标题"
          },
          description: {
            type: "string",
            description: "描述（内容）",
          },
          date: {
            type: ["string", "null"],
            description: "日期，格式为 YYYY-MM-DD"
          },
          time: {
            type: ["string", "null"],
            description: "时间，格式为 hh:mm",
          },
          earlyMinute: {
            type: ["number", "null"],
            description: "提前多少分钟提醒。设置为 0 时表示准时提醒，设置 1440 表示提前一天提醒。",
            enum: [0, 10, 15, 30, 60, 120, 1440]
          },
          laterHour: {
            type: ["number", "null"],
            description: `从现在起，往后推算多少小时后发生。设置为 0.5 表示三十分钟后，1 表示一小时后，24 表示一天后发生。该字段与 date, time, earlyMinute 三个字段互斥。`,
            enum: [0.5, 1, 2, 3, 24],
          }
        },
        required: ["description"],
        additionalProperties: false
      }
    }
  },

  /** Get schedule */
  {
    type: "function",
    function: {
      name: "get_schedule",
      description: "获取最近的日程",
      parameters: {
        type: "object",
        properties: {
          hoursFromNow: {
            type: "number",
            description: "获取最近几个小时内的日程，正数表示未来，举例: 24 表示获取未来 24 小时的日程，48 表示获取未来 48 小时的日程；负数表示过去，举例：-24 表示获取过去 24 小时的日程，-48 表示获取过去 48 小时的日程。",
            enum: [-24, 24, 48],
          },
          date: {
            type: "string",
            description: "获取昨天、今天或明天的日程。date 和 hoursFromNow 不可以同时指定。",
            enum: ["yesterday", "today", "tomorrow"]  
          }
        },
        additionalProperties: false
      }
    }
  },



]

