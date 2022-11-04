
export const supportedLocales = [
  "en",
  "zh-Hans",
  "zh-Hant"
] as const

export type SupportedLocale = typeof supportedLocales[number]

export const isSupportedLocale = (val: string): val is SupportedLocale => {
  return supportedLocales.includes(val as SupportedLocale)
}