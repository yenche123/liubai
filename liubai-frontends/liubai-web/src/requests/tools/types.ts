
export interface LiuRqOpt {
  method?: "POST" | "GET"
  signal?: AbortSignal       // 信号对象，用于中止 fetch() 请求
  timeout?: number           // 超时的毫秒数，默认为 10000; 当 signal 属性存在时，此值无意义
}

export interface LiuRqReturn<T> {
  code: string
  errMsg?: string
  showMsg?: string
  data?: T
}

export interface LiuErrReturn {
  code: string
  errMsg?: string
  showMsg?: string
}