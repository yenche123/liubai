import type { CpEmoji } from "./types"

const pre = `emojis-`
const dsPre = `drop-shadow(0 3px 15px `

export const emojiList: CpEmoji[] = [
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
    iconName: `${pre}clinking_glasses_color`,
    shadow: `${dsPre}var(--primary-color))`,
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