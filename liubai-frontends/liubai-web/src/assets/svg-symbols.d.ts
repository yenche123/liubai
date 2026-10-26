declare module "virtual:liu-svg-icons" {
  export const commonSymbols: string
  export const groups: Record<string, () => Promise<string>>
}
