
interface DataWithInputTxt {
  inputTxt: string              // 由 vue 的 v-model 来实现的 value
  nativeInputTxt?: string       // 从 document 原生 input 事件获取的 value
  lastOnInputStamp?: number
  [key: string]: any
}

export interface KeyboardOpt {
  whenKeyDown?: (e: KeyboardEvent) => void
  whenKeyUp?: (e: KeyboardEvent) => void
  data?: DataWithInputTxt
  setup?: boolean               // 是否在 setup 中调用，默认为 true
}