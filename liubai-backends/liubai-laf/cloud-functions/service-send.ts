// Function Name: service-send

// 发送短信、邮件
import cloud from '@lafjs/cloud'
import { Resend } from 'resend'
import type {
  LiuRqReturn,
  ServiceSendEmailsParam,
  Table_Credential,
  Wx_Param_Msg_Templ_Send,
  Wx_Res_Common,
} from "@/common-types"
import { 
  getNowStamp, 
  MINUTE, 
} from "@/common-time"
import { createEmailCode } from '@/common-ids'
import { liuReq } from '@/common-util'

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
  const fromEmail = _env.LIU_RESEND_FROM_EMAIL
  if(!fromEmail) {
    return { code: "E5001", errMsg: "no fromEmail in sendEmails" } 
  }

  const resend = getResendInstance()
  if(!resend) {
    return { code: "E5001", errMsg: "no resendApiKey in sendEmails" }
  }

  const appName = _env.LIU_APP_NAME
  if(!appName) {
    return { code: "E5001", errMsg: "appName is required in sendEmails" } 
  }

  if(!tags) {
    tags = [{ name: "category", value: "confirm_email" }]
  }

  const time1 = getNowStamp()
  const res = await resend.emails.send({
    from: `${appName} <${fromEmail}>`,
    to: param.to,
    subject,
    text: newText,
    html: newHtml,
    tags,
  })
  const time2 = getNowStamp()

  console.log(`resend 发送耗时: ${time2 - time1} ms`)
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

/** 去检索邮件发送结果 */
async function retrieveEmail(
  email_id: string,
): Promise<LiuRqReturn> {
  const resend = getResendInstance()
  if(!resend) {
    return { code: "E5001", errMsg: "no resendApiKey in retrieveEmail" } 
  }
  const res = await resend.emails.get(email_id)
  console.log("retrieveEmail res: ")
  console.log(res)
  console.log(" ")
  
  if(res.error) {
    return { code: "E5004", data: res.error }
  }
  if(res.data) {
    return { code: "0000", data: res.data }
  }

  return { code: "E5001", errMsg: "it's not as expected in retrieveEmail" }
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
  const list1 = res1.data ?? []
  const firRes = list1[0]
  if(!firRes) return

  // 检索邮件
  const rData: LiuRqReturn = {
    code: "E4003",
    errMsg: "sending to the email address too much"
  }
  if(firRes.email_id && firRes.send_channel === "resend") {
    const res2 = await retrieveEmail(firRes.email_id)
    const last_event = res2?.data?.last_event
    if(res2.code === "0000" && typeof last_event === "string") {
      rData.errMsg = `last_event: ${last_event}`
    }
  }
  
  return rData
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


function getResendInstance() {
  const _env = process.env
  const resendApiKey = _env.LIU_RESEND_API_KEY
  if(!resendApiKey) return
  const resend = new Resend(resendApiKey)
  return resend
}

/********************** About WeChat *****************/

const API_WECHAT_TMPL_SEND = "https://api.weixin.qq.com/cgi-bin/message/template/send"
const API_WECHAT_MSG_SEND = "https://api.weixin.qq.com/cgi-bin/message/custom/send"

export async function sendWxTemplateMessage(
  access_token: string,
  param: Wx_Param_Msg_Templ_Send,
) {
  const url = `${API_WECHAT_TMPL_SEND}?access_token=${access_token}`
  const res = await liuReq(url, param)
  return res
}

export async function sendWxTextMessage(
  wx_gzh_openid: string,
  access_token: string,
  text: string,
) {
  const body = {
    touser: wx_gzh_openid,
    msgtype: "text",
    text: {
      content: text,
    }
  }
  const url = new URL(API_WECHAT_MSG_SEND)
  url.searchParams.set("access_token", access_token)
  const link = url.toString()
  
  const d1 = getNowStamp()
  const res = await liuReq<Wx_Res_Common>(link, body)
  const d2 = getNowStamp()

  const { code, data } = res
  if(code !== "0000" || data?.errcode !== 0) {
    console.warn("sendWxTextMessage might fail")
    console.log(res)
    console.log(body)
  }
  else {
    // console.log(`sendWxTextMessage: ${d2 - d1}ms`)
  }

}