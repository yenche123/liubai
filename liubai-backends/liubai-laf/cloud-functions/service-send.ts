// Function Name: service-send

// 发送短信、邮件
import cloud from '@lafjs/cloud'
import { Resend } from 'resend'
import type {
  LiuRqReturn,
  LiuSendEmailsBase,
  LiuResendEmailsParam,
  LiuTencentSESParam,
  Table_Credential,
  Wx_Gzh_Send_Msg,
  Wx_Gzh_Send_Text,
  Wx_Param_Msg_Templ_Send,
  Wx_Res_Common,
} from "@/common-types"
import { 
  getNowStamp, 
  MINUTE, 
} from "@/common-time"
import { createEmailCode } from '@/common-ids'
import { LiuDateUtil, liuReq } from '@/common-util'
import { ses as TencentSES } from "tencentcloud-sdk-nodejs-ses"

const db = cloud.database()
const _ = db.command

export async function main(ctx: FunctionContext) {
  console.log("do nothing in service-send")
  return true
}

/********************** 发送邮件相关 *****************/


function checkEmailParam(param: LiuSendEmailsBase) {
  const { to } = param
  if(to.length < 1) {
    return { code: "E5001", errMsg: "to.length of param is meant to be bigger than 0" }
  }
}


/** package Tencent Simplet Email Service (SES) */
export class LiuTencentSES {
  static _getInstance() {
    const _env = process.env
    const secretId = _env.LIU_TENCENTCLOUD_SECRET_ID
    const secretKey = _env.LIU_TENCENTCLOUD_SECRET_KEY
    if(!secretId || !secretKey) {
      console.warn("secretId and secretKey of tencent cloud are required......")
      return
    }
    const region = _env.LIU_TENCENT_SES_REGION
    if(!region) {
      console.warn("LIU_TENCENT_SES_REGION is required......")
      return
    }

    const TecentSESClient = TencentSES.v20201002.Client
    const client = new TecentSESClient({
      credential: {
        secretId,
        secretKey,
      },
      region,
    })
    return client
  }

  static async sendEmails(
    param: LiuTencentSESParam,
  ): Promise<LiuRqReturn> {
    // 0. get subject
    const subject = param.subject

    // 1. get instance & check param
    const client = this._getInstance()
    if(!client) {
      return { code: "E5001", errMsg: "no tencent ses client in sendEmails" } 
    }
    const err1 = checkEmailParam(param)
    if(err1) return err1

    // 2. get fromEmail
    const _env = process.env
    const fromEmail = _env.LIU_TENCENT_SES_FROM_EMAIL
    if(!fromEmail) {
      return { code: "E5001", errMsg: "no fromEmail in sendEmails" } 
    }

    // 3. get appName
    const appName = _env.LIU_APP_NAME
    const replyEmail = _env.LIU_EMAIL_FOR_REPLY
    if(!appName) {
      return { code: "E5001", errMsg: "appName is required in sendEmails" } 
    }

    // 4. send email
    try {
      const res4 = await client.SendEmail({
        FromEmailAddress: `${appName} <${fromEmail}>`,
        Destination: param.to,
        Subject: subject,
        ReplyToAddresses: replyEmail,
        Template: param.Template,
      })

      if(res4.MessageId) {
        return { code: "0000", data: res4 }
      }
      console.warn("tencent ses sending emails probably failed")
      console.log(res4)

    }
    catch(err) {
      console.warn("tencent ses send emails failed")
      console.log(err)
      return { code: "U0005" }
    }
    
    return { code: "0000" }
  }

  static async retrieveEmail(
    MessageId: string,
  ): Promise<LiuRqReturn> {
    const client = this._getInstance()
    if(!client) {
      return { code: "E5001", errMsg: "no tencent ses client in retrieveEmail" } 
    }
    const date = LiuDateUtil.getYYYYMMDD(getNowStamp())
    
    try {
      const res = await client.GetSendEmailStatus({
        Limit: 10,
        Offset: 0,
        RequestDate: date,
        MessageId,
      })

      // SendEmailStatus: https://cloud.tencent.com/document/product/1288/51053#SendEmailStatus
      if(res.EmailStatusList?.length) {
        return { code: "0000", data: res.EmailStatusList[0] }
      }
    }
    catch(err) {
      console.warn("tencent ses retrieveEmail failed")
      console.log(err)
      return { code: "E5004" }
    }

    return { code: "E5001", errMsg: "it's not as expected in retrieveEmail" }
  }

}



/** package Resend */
export class LiuResend {

  /** 去发送邮件 */
  static async sendEmails(
    param: LiuResendEmailsParam,
  ): Promise<LiuRqReturn> {
    let { subject, tags, text, html } = param
    const err1 = checkEmailParam(param)
    if(err1) return err1

    if(!text && !html) {
      return { code: "E5001", errMsg: "no text or html of param in sendEmails" }
    }
  
    const _env = process.env
    const fromEmail = _env.LIU_RESEND_FROM_EMAIL
    if(!fromEmail) {
      return { code: "E5001", errMsg: "no fromEmail in sendEmails" } 
    }
  
    const resend = this._getResendInstance()
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
  
    try {
      const time1 = getNowStamp()
      const res = await resend.emails.send({
        from: `${appName} <${fromEmail}>`,
        to: param.to,
        subject,
        text: param.text as string,
        html: param.html as string,
        tags,
      })
      const time2 = getNowStamp()
    
      console.log(`resend 发送耗时: ${time2 - time1} ms`)
      console.log("查看 resend 的发送结果>>>")
      console.log(res)
    
      if(res.error) {
        return { code: "U0005", data: res.error }
      }

      if(res.data) {
        return { code: "0000", data: res.data }
      }
    }
    catch(err) {
      console.warn("resend send emails failed")
      console.log(err)
      return { code: "U0005" }
    }
    
    return { code: "0000" }
  }

  static async retrieveEmail(
    email_id: string,
  ): Promise<LiuRqReturn> {
    const resend = this._getResendInstance()
    if(!resend) {
      return { code: "E5001", errMsg: "no resendApiKey in retrieveEmail" } 
    }
    const res = await resend.emails.get(email_id)
    console.log("LiuResend retrieveEmail res: ")
    console.log(res)
    
    if(res.error) {
      return { code: "E5004", data: res.error }
    }
    if(res.data) {
      return { code: "0000", data: res.data }
    }
  
    return { code: "E5001", errMsg: "it's not as expected in retrieveEmail" }
  }

  private static _getResendInstance() {
    const _env = process.env
    const resendApiKey = _env.LIU_RESEND_API_KEY
    if(!resendApiKey) return
    const resend = new Resend(resendApiKey)
    return resend
  }

}


/** 检查是否发送过于频繁 */
export async function checkIfEmailSentTooMuch(
  email: string,
): Promise<LiuRqReturn | undefined> {

  // 1. get credential
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

  // 2. retrieve email
  const rData: LiuRqReturn = {
    code: "E4003",
    errMsg: "sending to the email address too much"
  }
  if(firRes.email_id && firRes.send_channel === "resend") {
    const res2 = await LiuResend.retrieveEmail(firRes.email_id)
    const last_event = res2?.data?.last_event
    if(res2.code === "0000" && typeof last_event === "string") {
      rData.errMsg = `last_event: ${last_event}`
    }
  }
  if(firRes.email_id && firRes.send_channel === "tencent-ses") {
    const res2 = await LiuTencentSES.retrieveEmail(firRes.email_id)

    // you can see https://cloud.tencent.com/document/product/1288/51053#SendEmailStatus 
    // to know about res2.data 
    let last_event = "delivered"
    const d2 = res2.data ?? {}
    const SendStatus = d2.SendStatus ?? 0
    const DeliverStatus = d2.DeliverStatus ?? 0

    if(SendStatus !== 0) {
      console.warn("tencent ses SendStatus is not 0")
      console.log(d2)
    }
    else if(DeliverStatus > 1) {
      console.warn("tencent ses deliverStatus is greater than 1")
      console.log(d2)
    }

    // 1008: 域名被收件人拒收
    // 1013: 域名被收件人取消订阅
    // 3020: 收件方邮箱类型在黑名单
    if(SendStatus === 1008 || SendStatus === 1013 || SendStatus === 3020) {
      last_event = "bounced"
    }

    if(res2.code === "0000") {
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
  const body: Wx_Gzh_Send_Text = {
    msgtype: "text",
    text: {
      content: text,
    }
  }
  const res = await sendWxMessage(wx_gzh_openid, access_token, body)
}

export async function sendWxMessage(
  wx_gzh_openid: string,
  access_token: string,
  param: Wx_Gzh_Send_Msg,
) {
  const obj = {
    touser: wx_gzh_openid,
    ...param,
  }
  const url = new URL(API_WECHAT_MSG_SEND)
  url.searchParams.set("access_token", access_token)
  const link = url.toString()
  const res = await liuReq<Wx_Res_Common>(link, obj)
  const { code, data } = res
  if(code !== "0000" || data?.errcode !== 0) {
    console.warn("sendWxMessage failed")
    console.log(res)
    console.log(param)
  }
  return res
} 
