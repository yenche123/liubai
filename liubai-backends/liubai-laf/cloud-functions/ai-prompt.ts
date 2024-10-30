import type { AiBot } from "@/common-types"

export const aiBots: AiBot[] = [
  {
    name: "DeepSeek",
    character: "deepseek",
    provider: "deepseek",
    model: "deepseek-chat",
    abilities: ["chat"],
    alias: ["深度求索"]
  },
  {
    name: "Kimi",
    character: "kimi",
    provider: "moonshot",
    model: "moonshot-v1-8k",
    abilities: ["chat"],
    alias: ["Moonshot", "月之暗面"]
  },
  {
    name: "跃问",
    character: "yuewen",
    provider: "stepfun",
    model: "step-1-8k",
    abilities: ["chat"],
    alias: ["阶跃星辰"]
  },
  {
    name: "万知",
    character: "wanzhi",
    provider: "zero-one",
    model: "yi-lightning",
    abilities: ["chat"],
    alias: ["零一万物", "01.ai"]
  },
  {
    name: "智谱",
    character: "zhipu",
    provider: "zhipu",
    model: "glm-4-plus",
    abilities: ["chat"],
    alias: ["智谱AI", "智谱清言", "ChatGLM"]
  }
]