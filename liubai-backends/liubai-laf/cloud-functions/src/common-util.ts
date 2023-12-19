// 存放一些公共函数
import cloud from '@lafjs/cloud'
import * as crypto from "crypto"
import type { 
  LiuSpaceAndMember,
  MemberAggSpaces,
  LocalTheme,
  LocalLanguage,
  SupportedLocale,
} from '@/common-types'
import { supportedLocales } from "@/common-types"
import { getNowStamp, SECONED } from "@/common-time"

/********************* 常量 ****************/
export const reg_exp = {
  // 捕捉 整个字符串都是 email
  email_completed: /^[\w\.-]{1,32}@[\w-]{1,32}\.\w{2,32}[\w\.-]*$/g,
}


/********************* 空函数 ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with common-util")
  return true
}

/********************* Crypto 加解密相关的函数 ****************/

/**
 * 使用 RSA 的密钥解密数据
 * @param encryptedText base64 格式的密文
 */
export function decryptWithRSA(encryptedText: string) {
  const pk = getPrivateKey()
  if(!pk) {
    return { code: "E5001", errMsg: "no private key" }
  }

  const privateKeyObj = crypto.createPrivateKey({
    key: pk,
    format: 'pem',
    type: 'pkcs8',
  })

  const buffer = Buffer.from(encryptedText, "base64")
  
  let plainText = ""
  try {
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKeyObj,
        oaepHash: "SHA256"
      },
      buffer
    )
    plainText = decryptedData.toString('utf8')
  }
  catch(err1) {
    console.warn("解密失败........")
    console.log(err1)
    console.log(" ")
    return { code: "E4003", errMsg: "fail to decrypt" }
  }

  return { plainText }
}

/** 获取 RSA private key */
function getPrivateKey() {
  const keyPair = cloud.shared.get(`liu-rsa-key-pair`)
  const privateKey = keyPair?.privateKey
  if(!privateKey) return undefined
  return privateKey as string
}

/** 获取 RSA public key */
export function getPublicKey() {
  const keyPair = cloud.shared.get(`liu-rsa-key-pair`)
  const publicKey = keyPair?.publicKey
  if(!publicKey) return undefined
  return publicKey as string
}


/********************* 一些工具函数 *****************/

export function getIp(ctx: FunctionContext) {
  const ip = ctx?.headers?.['x-real-ip']
  if(ip && typeof ip === "string") return ip
}


/**
 * 获取新增的数据的 _id
 * @param res 运行 await collection(表名).add() 后的返回数据
 */
export function getDocAddId(res: any) {
  if(!res) {
    console.log("getDocAddId() the res has not existed")
    return null
  }

  const _id = res.id
  if(!_id) {
    console.log("getDocAddId() _id has not existed")
    return null
  }

  if(typeof _id !== "string") {
    console.log("getDocAddId() _id is not string")
    return null
  }

  return _id
}

/** 给定文件名或含后缀的文件路径 获取后缀（不含.） 
 *  会将后缀转为小写
 *  若提取失败 则返回空的字符串
*/
export function getSuffix(name: string) {
  const arr = /\.([\w]*)$/.exec(name)
  if(!arr) return ""
  const format = arr[1].toLowerCase()
  return format
}



/********************* 封装函数 *****************/

/** 将聚合搜索（联表查询）到的 member 和 workspace 信息打包装 
 * 成 LiuSpaceAndMember(LSAM)
 * @param data 聚合搜素后的 res.data
 * @param filterMemberLeft 是否过滤掉成员已退出，默认为 true
*/
export function turnMemberAggsIntoLSAMs(
  data: any,
  filterMemberLeft: boolean = true,
) {

  const len1 = data?.length
  const isDataExisted = Boolean(len1)
  if(!isDataExisted) {
    return []
  }

  const list: LiuSpaceAndMember[] = []

  for(let i=0; i<len1; i++) {
    const v = data[i] as MemberAggSpaces
    const member_oState = v.oState
    if(member_oState === "LEFT" && filterMemberLeft) continue

    const { spaceList } = v
    const len2 = spaceList?.length
    if(!len2) continue
    const theSpace = spaceList[0]
    const space_oState = theSpace.oState
    if(space_oState !== "OK") continue

    const obj: LiuSpaceAndMember = {
      spaceId: theSpace._id,
      memberId: v._id,
      member_name: v.name,
      member_avatar: v.avatar,
      member_oState,
      spaceType: theSpace.infoType,
      space_oState,
      space_owner: theSpace.owner,
    }

    list.push(obj)
  }

  return list
}



/********************* 一些 “归一化” 相关的函数 *****************/

/** 检测 val 是否为 email，若是则全转为小写 */
export function isEmailAndNormalize(val: any) {
  if(!val || typeof val !== "string") return false

  // 最短的 email 应该长这样 a@b.cn 至少有 6 个字符
  if(val.length < 6)  return false

  // 使用正则判断是否为 email
  const m = val.match(reg_exp.email_completed)
  let isEmail = Boolean(m?.length)
  if(!isEmail) return false

  // 确保第一个字符和最后一个字符 不会是 \. 和 -
  const tmps = [".", "-"]
  const firstChar = val[0]
  if(tmps.includes(firstChar)) return false
  const lastChar = val[val.length - 1]
  if(tmps.includes(lastChar)) return false

  const newVal = val.toLowerCase()
  return newVal
}

/** 归一化主题至 LocalTheme */
export function normalizeToLocalTheme(str: any): LocalTheme {
  if(!str || typeof str !== "string") return "system"
  const tmpList: LocalTheme[] = ["light", "dark", "auto", "system"]
  const isInIt = tmpList.includes(str as LocalTheme)
  if(isInIt) return str as LocalTheme
  return "system"
}

/** 归一化语言至 LocalLanguage  */
export function normalizeToLocalLanguage(str: any): LocalLanguage {
  if(!str || typeof str !== "string") return "system"
  const isInIt = supportedLocales.includes(str as SupportedLocale)
  if(isInIt) return str as LocalLanguage
  return "system"
}


/********************* 一些验证、检查函数 *****************/

/** 指数级访问的检查: 
 * 第 x 次访问，必须与 startedStamp 相差 x^2 秒
 * @param startedStamp 待验证的数据被创建的时间戳
 * @param verifiedNum 不包含本次，已被检查的次数
*/
export function canPassByExponentialDoor(
  startedStamp: number,
  verifiedNum?: number,
) {
  if(!verifiedNum) {
    return { verifiedNum: 1, pass: true }
  }

  verifiedNum++
  
  if(verifiedNum > 8) {
    console.log("try too much. bye bye~")
    return { verifiedNum, pass: false }
  }

  const requiredSec = 3 ** verifiedNum
  const now = getNowStamp()
  const diffSec = (now - startedStamp) / SECONED
  const pass = diffSec > requiredSec
  return { verifiedNum, pass }
}

