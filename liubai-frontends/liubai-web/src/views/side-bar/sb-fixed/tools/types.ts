

export interface SbfData {
  state: "closed" | "opening" | "opened" | "closing"
  enable: boolean
  bgOpacity: number       // 介于 0 至 1 之间
  distance: string        // "-110%" /  "0"   /  "-54px"
  duration: string        // "300ms" / "0"
}