// 发送短信、邮件
import { Resend } from 'resend'
import type {
  LiuRqReturn,
  ServiceSendEmailsParam
} from "@/common-types"

export async function main(ctx: FunctionContext) {
  console.log("do nothing in service-send")
  return true
}

/********************** 发送邮件 *****************/
export async function sendEmails(
  param: ServiceSendEmailsParam,
): Promise<LiuRqReturn> {
  
  let { text, html, subject, tags } = param
  if(!text && !html) {
    return { code: "E5001", errMsg: "no text or html of param in sendEmails" }
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

  return { code: "0000", data: res }
}
