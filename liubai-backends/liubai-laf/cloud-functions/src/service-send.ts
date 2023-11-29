// 发送短信、邮件
import cloud from '@lafjs/cloud'
import { Resend } from 'resend'
import type {
  LiuRqReturn,
  ServiceSendEmailsParam
} from "@/common-types"
import { 
  getNowStamp, 
  MINUTE, 
} from "@/common-time"
import type { Table_Credential } from "@/common-types"
import { createEmailCode } from '@/common-ids'

const db = cloud.database()
const _ = db.command

export async function main(ctx: FunctionContext) {
  console.log("do nothing in service-send")
  return true
}

/********************** 发送邮件相关 *****************/

/** 去发送邮件 */
export async function sendEmails(
  param: ServiceSendEmailsParam,
): Promise<LiuRqReturn> {
  
  let { text, html, subject, tags } = param
  if(!text && !html) {
    return { code: "E5001", errMsg: "no text or html of param in sendEmails" }
  }
  if(param.to.length < 1) {
    return { code: "E5001", errMsg: "to.length of param is meant to be bigger than 0" }
  }

  const newText = text as string
  const newHtml = html as string

  const _env = process.env
  const resendApiKey = _env.LIU_RESEND_API_KEY
  const fromEmail = _env.LIU_RESEND_FROM_EMAIL
  if(!resendApiKey || !fromEmail) {
    return { code: "E5001", errMsg: "no resendApiKey or fromEmail in sendEmails" } 
  }

  const appName = _env.LIU_APP_NAME
  if(!appName) {
    return { code: "E5001", errMsg: "appName is required in sendEmails" } 
  }

  if(!tags) {
    tags = [{ name: "category", value: "confirm_email" }]
  }

  const resend = new Resend(resendApiKey)
  const res = await resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: param.to,
    subject,
    text: newText,
    html: newHtml,
    tags,
  })

  console.log("查看 resend 的发送结果>>>")
  console.log(res)
  console.log(" ")

  if(res.error) {
    return { code: "U0005", data: res.error }
  }

  if(res.data) {
    return { code: "0000", data: res.data }
  }

  return { code: "0000" }
}

/** 检查是否发送过于频繁 */
export async function checkIfEmailSentTooMuch(
  email: string,
): Promise<LiuRqReturn | undefined> {
  const now1 = getNowStamp()
  const ONE_MIN_AGO = now1 - MINUTE
  const w1 = { 
    infoType: "email-code",
    email,
    insertedStamp: _.gte(ONE_MIN_AGO),
  }
  const res1 = await db.collection("Credential").where(w1).get<Table_Credential>()
  const list1 = res1.data
  if(list1.length > 0) {
    return { code: "E4003", errMsg: "sending to the email address too much" }
  }
}

/** 获取有效的 email code */
export async function getActiveEmailCode(): Promise<LiuRqReturn> {
  let times = 0
  while(true) {
    times++
    if(times > 5) {
      break
    }
    const code = createEmailCode()
    const w: Partial<Table_Credential> = { 
      infoType: "email-code", 
      credential: code,
    }
    const res = await db.collection("Credential").where(w).get<Table_Credential>()
    const len = res.data?.length
    if(len < 1) {
      return { code: "0000", data: { code } }
    }
  }

  return { code: "E5001", errMsg: "cannot get an active email code" }
}
