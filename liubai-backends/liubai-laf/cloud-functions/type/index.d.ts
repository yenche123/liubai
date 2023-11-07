import { 
  FunctionContext as _FunctionContext
} from "@lafjs/cloud"



type LiuSwitch = "01" | "02" | undefined

declare global {
  type FunctionContext = _FunctionContext

  namespace NodeJS {
    interface ProcessEnv {

      /** 由 Laf 所定义的字段 */
      APPID: string

      /** 总服务状态，默认开启，仅当值为 `02` 时关闭 */
      LIU_CLOUD_ON: LiuSwitch

      /** 是否开放登录，默认开启，仅当值为 `02` 时关闭 */
      LIU_CLOUD_LOGIN: LiuSwitch

    }
  }
}