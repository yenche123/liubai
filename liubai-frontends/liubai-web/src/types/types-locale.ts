

export type SupportedLocale = "en" | "zh-Hans" | "zh-Hant"

export const supportedLocales: SupportedLocale[] = [
  "en",
  "zh-Hans",
  "zh-Hant"
]

export const isSupportedLocale = (val: string): val is SupportedLocale => {
  return (supportedLocales as string[]).includes(val)
}