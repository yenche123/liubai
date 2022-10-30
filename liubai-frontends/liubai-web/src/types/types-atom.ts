// 一些最基础的原子类型

export type LiuRemindLater = "30min" | "1hr" | "2hr" | "3hr" | 
  "tomorrow_morning" | "tomorrow_this_moment"

// "提醒我" 的结构
export interface LiuRemindMe {
  type: "early" | "later" | "specific_time"

  // 提前多少分钟，若提前一天则为 1440
  early_minute?: number   

  // 30分钟后、1小时候、2小时后、3小时候、明天早上、明天此刻
  later?: LiuRemindLater

  // 具体时间
  specific_time?: Date
}