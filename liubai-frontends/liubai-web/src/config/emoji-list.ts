
const pre = `emojis-`
const dsPre = `drop-shadow(0 3px 15px `

export interface EmojiItem {
  emoji: string      // 无需 encode
  iconName: string
  shadow: string
  key: string
  currentFilter?: string   // 当前 emoji 的 filter；
                           // 当鼠标悬浮其上时，currentFilter 会被修改成 shadow
}


export const emojiList: EmojiItem[] = [
  {
    emoji: "❤️",
    iconName: `${pre}heart_suit_color`,
    shadow: `${dsPre}#fa3c90)`,
    key: "love",
  },
  {
    emoji: "👌",
    iconName: `${pre}ok_hand_color_default`,
    shadow: `${dsPre}#f5ac44)`,
    key: "ok",
  },
  {
    emoji: "👏",
    iconName: `${pre}clapping_hands_color_default`,
    shadow: `${dsPre}#1b7de2)`,
    key: "applaud",
  },
  {
    emoji: "🤣",
    iconName: `${pre}rolling_on_the_floor_laughing_color`,
    shadow: `${dsPre}#b10597)`,
    key: "lol",
  },
  {
    emoji: "🥂",
    iconName: `${pre}bottle_with_popping_cork_color`,
    shadow: `${dsPre}#5a9137)`,
    key: "cheers",
  },
  {
    emoji: "🔥",
    iconName: `${pre}fire_color`,
    shadow: `${dsPre}#f25038)`,
    key: "fire",
  },
  {
    emoji: "🤔",
    iconName: `${pre}thinking_face_color`,
    shadow: `${dsPre}#e87247)`,
    key: "thinking",
  },
  {
    emoji: "☕",
    iconName: `${pre}hot_beverage_color`,
    shadow: `${dsPre}#825358)`,
    key: "cafe",
  }
]
