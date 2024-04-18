// 存放一些公共函数
import cloud from '@lafjs/cloud'
import * as crypto from "crypto"
import type { 
  LiuSpaceAndMember,
  MemberAggSpaces,
  LocalTheme,
  LocalLocale,
  SupportedLocale,
  Shared_TokenUser,
  VerifyTokenOpt,
  VerifyTokenRes,
  Table_Token,
  Table_User,
  LiuUserInfo,
  SupportedClient,
  PartialSth,
  LiuRqReturn,
  CryptoCipherAndIV,
  LiuPlainText,
  Cloud_ImageStore,
  Cloud_FileStore,
  LiuContent,
} from '@/common-types'
import { 
  supportedLocales,
  Sch_Cloud_FileStore,
  Sch_Cloud_ImageStore,
  Sch_Simple_LiuContent,
} from "@/common-types"
import { createToken, createEncNonce } from "@/common-ids"
import { 
  getNowStamp, 
  getBasicStampWhileAdding, 
  SECONED, DAY, MINUTE, 
} from "@/common-time"
import geoip from "geoip-lite"
import Stripe from "stripe"
import * as vbot from "valibot"

const db = cloud.database()
const _ = db.command


/********************* 常量 ****************/
const MIN_5 = MINUTE * 5
const DAY_90 = DAY * 90
const DAY_28 = DAY * 28
const DAY_7 = DAY * 7

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
    return
  }

  const _id = res.id
  if(!_id) {
    console.log("getDocAddId() _id has not existed")
    return
  }

  if(typeof _id !== "string") {
    console.log("getDocAddId() _id is not string")
    return
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
      memberId: v._id,
      member_name: v.name,
      member_avatar: v.avatar,
      member_oState,
      
      spaceId: theSpace._id,
      spaceType: theSpace.infoType,
      space_oState,
      space_owner: theSpace.owner,
      space_name: theSpace.name,
      space_avatar: theSpace.avatar,
    }

    list.push(obj)
  }

  return list
}



/********************* 一些 “归一化” 相关的函数 *****************/

/** 检测 val 是否为 email，若是则全转为小写 */
export function isEmailAndNormalize(val: any) {
  const Sch = vbot.string([
    vbot.toTrimmed(),
    vbot.email(),
    vbot.toLowerCase(),
  ])
  const res = vbot.safeParse(Sch, val)
  if(!res.success) return false
  return res.output
}

/** 归一化主题至 LocalTheme */
export function normalizeToLocalTheme(str: any): LocalTheme {
  if(!str || typeof str !== "string") return "system"
  const tmpList: LocalTheme[] = ["light", "dark", "auto", "system"]
  const isInIt = tmpList.includes(str as LocalTheme)
  if(isInIt) return str as LocalTheme
  return "system"
}

/** 归一化语言至 LocalLocale  */
export function normalizeToLocalLocale(str: any): LocalLocale {
  if(!str || typeof str !== "string") return "system"
  const isInIt = supportedLocales.includes(str as SupportedLocale)
  if(isInIt) return str as LocalLocale
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

function getErrMsgFromIssues(issues: vbot.SchemaIssues) {
  const issue = issues?.[0]
  const msg = issue?.message
  return msg ?? "get error from valibot"
}

/** 
 * 检测是否为 images 属于 Cloud_ImageStore[] 类型 
 *  注意: 若 images 是 undefined 返回 true
*/
function isImagesLegal(images?: Cloud_ImageStore[]) {
  const Sch = vbot.optional(vbot.array(Sch_Cloud_ImageStore))
  const res = vbot.safeParse(Sch, images)
  return res.success
}

/** 
 * 检测是否为 files 属于 Cloud_FileStore[] 类型 
 *  注意: 若 files 是 undefined 返回 true
*/
function isFilesLegal(files?: Cloud_FileStore[]) {
  const Sch = vbot.optional(vbot.array(Sch_Cloud_FileStore))
  const res = vbot.safeParse(Sch, files)
  return res.success
}


// LiuContent 最大嵌套层数
const LIU_CONTENT_NESTING_MAX = 6

/** 检测 liuDesc 是否合法 */
function isLiuContentArr(
  list?: LiuContent[],
  level?: number
) {
  if(!level) level = 1

  if(typeof list === "undefined") return true
  if(!Array.isArray(list)) return false
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const res1 = vbot.safeParse(Sch_Simple_LiuContent, v)
    if(!res1.success) return false
    if(v.content) {
      if(level >= LIU_CONTENT_NESTING_MAX) return false
      const res2 = isLiuContentArr(v.content, level + 1)
      if(!res2) return false
    }
  }
  return true
}

export const checker = {
  getErrMsgFromIssues,
  isImagesLegal,
  isFilesLegal,
  isLiuContentArr,
}


/******************************** 用户相关 ******************************/

/** 给定多个 userData 给出其 userInfos 
 * @param filterMemberLeft 是否过滤掉成员已离开
*/
export async function getUserInfos(
  users: Table_User[],
  filterMemberLeft: boolean = true,
) {
  const userInfos: LiuUserInfo[] = []

  for(let i=0; i<users.length; i++) {
    const v = users[i]
    const userId = v._id

    let m_oState = _.or(_.eq("OK"), _.eq("DEACTIVATED"))
    if(!filterMemberLeft) {
      m_oState = _.or(_.eq("OK"), _.eq("DEACTIVATED"), _.eq("LEFT"))
    }

    // 1. 用 lookup 去查找 member 和 workspace
    const res = await db.collection("Member").aggregate()
      .match({
        user: userId,
        oState: m_oState,
      })
      .sort({
        insertedStamp: 1,
      })
      .lookup({
        from: "Workspace",
        localField: "spaceId",
        foreignField: "_id",
        as: "spaceList",
      })
      .end()
    
    // console.log("看一下 getUserInfos 中聚合搜索的结果: ")
    // console.log(res)
    // console.log(" ")

    const lsams = turnMemberAggsIntoLSAMs(res.data, filterMemberLeft)
    if(lsams.length) {
      userInfos.push({ user: v, spaceMemberList: lsams })
    }
  }
  return userInfos
}


/** 获取 token 数据 */
async function _getTokenData(
  token: string,
  serial_id: string,
) {
  const col = db.collection("Token")
  const res = await col.doc(serial_id).get<Table_Token>()
  const d = res.data
  if(!d) return

  // 检查是否过期
  const now = getNowStamp()
  if(now > d.expireStamp) return

  // 检查 token 是否一致
  const _token = d.token
  if(_token !== token) return

  return d 
}

/** 获取 user 数据 */
async function _getUserData(userId: string) {
  const col = db.collection("User")
  const res = await col.doc(userId).get<Table_User>()
  const d = res.data
  if(!d) return
  return d
}

function getLiuTokenUser() {
  const gShared = cloud.shared
  const map: Map<string, Shared_TokenUser> = gShared.get('liu-token-user') ?? new Map()
  return map
}

/** 更新 token 数据至 Token 表中 
 *  注意：该函数不会更新缓存
*/
function updateTokenRow(
  id: string,
  partialTokenData: Partial<Table_Token>,
) {
  partialTokenData.updatedStamp = getNowStamp()
  const col = db.collection("Token")
  col.where({ _id: id }).update(partialTokenData)
  return partialTokenData
}

/** 更新 token 数据至全局缓存中 */
function updateTokenCache(
  data: Shared_TokenUser,
  map: Map<string, Shared_TokenUser>,
  gShared: Map<string, any>,
  newTokenData: Table_Token,
) {
  const now = getNowStamp()
  data.tokenData = newTokenData
  data.lastSet = now
  map.set(newTokenData._id, data)
  gShared.set("liu-token-user", map)
}

/** check if the user's subscription is currently active */
export function checkIfUserSubscribed(
  user: Table_User,
) {
  const s = user.subscription
  const isOn = s?.isOn
  if(!s || !isOn) return false
  const isLifelong = s.isLifelong
  if(isLifelong) return true
  const expireStamp = s.expireStamp ?? 1
  const now = getNowStamp()
  const diff = expireStamp - now
  if(diff > 0) return true
  return false
}

/** 插入 token 数据至 Token 表中
 *  并且存到缓存里
 */
export async function insertToken(
  ctx: FunctionContext,
  body: Record<string, string>,
  user: Table_User,
  workspaces: string[],
  client_key?: string,
) {
  // 1. 先存到 Token 表中
  const token = createToken()
  const now = getNowStamp()
  const expireStamp = now + (30 * DAY)
  const basic1 = getBasicStampWhileAdding()
  const platform = body['x_liu_client'] as SupportedClient
  const ip = getIp(ctx)
  const obj1: PartialSth<Table_Token, "_id"> = {
    ...basic1,
    token,
    expireStamp,
    userId: user._id,
    isOn: "Y",
    platform,
    client_key,
    lastRead: now,
    lastSet: now,
    ip,
  }
  const res1 = await db.collection("Token").add(obj1)
  const serial_id = getDocAddId(res1)
  if(!serial_id) return
  const tokenData: Table_Token = { _id: serial_id, ...obj1 }

  // 2. 再存到 shared 中
  const obj2: Shared_TokenUser = {
    token,
    tokenData,
    userData: user,
    workspaces,
    lastSet: now,
  }
  const map = getLiuTokenUser()
  map.set(serial_id, obj2)
  cloud.shared.set("liu-token-user", map) 

  return tokenData
}


/** 验证 token / serial_id
 *   若过程中，发现 user 的 `oState` 不为 `NORMAL`，则不通过；
 *   一切正常，返回 token 和 user 数据。
 */
export async function verifyToken(
  ctx: FunctionContext,
  body: Record<string, string>,
  opt?: VerifyTokenOpt,
): Promise<VerifyTokenRes> {
  const token = body["x_liu_token"]
  const serial_id = body["x_liu_serial"]

  if(!token || !serial_id) {
    return {
      pass: false,
      rqReturn: {
        code: "E4000",
        errMsg: "token, serial_id are required", 
      },
    }
  }

  const gShared = cloud.shared
  const map = getLiuTokenUser()

  const errReturn: LiuRqReturn = { 
    code: "E4003", 
    errMsg: "the verification of token failed",
  }
  const errRes = { pass: false, rqReturn: errReturn }

  let data = map.get(serial_id)
  let tokenData = data?.tokenData
  let userData = data?.userData
  let workspaces = data?.workspaces

  const now1 = getNowStamp()
  const diff1 = now1 - (data?.lastSet ?? 1)

  if(!data || diff1 > MIN_5) {
    // if the cache is not existed
    tokenData = await _getTokenData(token, serial_id)
    if(!tokenData) return errRes
    userData = await _getUserData(tokenData.userId)
    if(!userData) return errRes
    const userInfos = await getUserInfos([userData])
    if(userInfos.length < 1) return errRes
    const uInfo = userInfos[0]
    workspaces = uInfo.spaceMemberList.map(v => v.spaceId)
    data = {
      token,
      tokenData,
      userData,
      workspaces,
      lastSet: getNowStamp(),
    }
    map.set(serial_id, data)
    gShared.set("liu-token-user", map)
  }
  else {
    // if the cache is existed
    if(data.token !== token) return errRes
    if(now1 > data.tokenData.expireStamp) return errRes
  }
  
  if(!data || !tokenData || !userData || !workspaces) return errRes
  if(tokenData.isOn !== "Y") return errRes
  if(userData.oState !== "NORMAL") return errRes

  // 如果当前是 user-login 的 enter 流程
  // 判断要不要刷新 token 和 serial
  let new_token: string | undefined
  let new_serial: string | undefined

  let partialTokenData: Partial<Table_Token> = {}
  let updateRequired = false

  if(opt?.entering) {

    // --------------> 1. 检验 token 的有效期，若快过期去自动延长
    
    const now2 = getNowStamp()

    // 该 token 已经生成多久了
    const diff_1 = now2 - tokenData.insertedStamp

    // 该 token 还有多久过期
    const diff_2 = tokenData.expireStamp - now2

    if(diff_1 > DAY_90) {
      // 若生成时间已大于 90 天，去生成新的 token
      const newTokenData = await insertToken(ctx, body, userData, workspaces, tokenData.client_key)
      if(newTokenData) {

        // 把旧的 token 改成 1 分钟后过期
        const tmpExpireStamp = now2 + MINUTE
        partialTokenData = { expireStamp: tmpExpireStamp }
        updateRequired = true

        // 取出新的 token 和 serial
        new_token = newTokenData.token
        new_serial = newTokenData._id
      }
    }
    else if(diff_2 < DAY_28) {
      // 若在 28 天内过期，则去延长 7 天
      const tmpExpireStamp = tokenData.expireStamp + DAY_7
      partialTokenData = { expireStamp: tmpExpireStamp }
      updateRequired = true
    }

    // --------------> 2. 判断 ip 是否不一致
    const ipGeo = getIpGeo(ctx)
    if(ipGeo && ipGeo !== tokenData.ipGeo) {
      partialTokenData = { ...partialTokenData, ipGeo }
      updateRequired = true
    }

    // --------------> 3. 最后去更新 token
    if(updateRequired) {
      partialTokenData = updateTokenRow(tokenData._id, partialTokenData)
      tokenData = { ...tokenData, ...partialTokenData }
      updateTokenCache(data, map, gShared, tokenData)
    }

  }

  // 检查 tokenData 的 lastSet / lastRead
  tokenData = checkTokenDataLastStamp(data, map, gShared, opt)

  return { 
    pass: true,
    tokenData,
    userData,
    workspaces,
    new_token,
    new_serial,
  }
}

/** 检查 Token 的 isRead isSet 
 * 若超过 10 分钟，就去更新
*/
function checkTokenDataLastStamp(
  data: Shared_TokenUser,
  map: Map<string, Shared_TokenUser>,
  gShared: Map<string, any>,
  opt?: VerifyTokenOpt,
) {
  const entering = opt?.entering
  let isRead = opt?.isRead
  let isSet = opt?.isSet
  if(entering) {
    isRead = true
    isSet = true
  }

  let tokenData = data.tokenData
  if(!isRead && !isSet) return tokenData
  const { lastRead, lastSet } = tokenData
  const now = getNowStamp()
  const MIN_10 = MINUTE * 10
  const diff_read = now - lastRead
  const diff_set = now - lastSet

  let updateRead = false
  let updateSet = false
  if(isRead && diff_read > MIN_10) updateRead = true
  if(isSet && diff_set > MIN_10) updateSet = true
  
  if(!updateRead && !updateSet) return tokenData
  const u: Partial<Table_Token> = {}
  if(updateRead) u.lastRead = now
  if(updateSet) u.lastSet = now

  const serial_id = tokenData._id
  let pTokenData = updateTokenRow(serial_id, u)
  tokenData = { ...tokenData, ...pTokenData }

  // 更新缓存
  updateTokenCache(data, map, gShared, tokenData)

  return tokenData
}


export function updateUserInCache(
  userId: string,
  user?: Table_User,
) {
  const map = getLiuTokenUser()
  let num = 0

  map.forEach((val, key) => {
    const _user_id = val.userData._id
    if(userId !== _user_id) return

    // avoid running in the loop
    if(num > 16) return
    num++

    if(user) {
      val.lastSet = getNowStamp()
      val.userData = user
      console.log("找到要更新的 cache........")
      console.log(val)
      map.set(key, val)
    }
    else {
      map.delete(key)
    }

  })

  // 最后不需要再对 cloud.shared 进行 set
  // 因为引用存在时，修改里头的值时，外部的 shared 也会更改
  // 若引用不存在时，代表为空的 map 也不需要更新
}


/************************** 加解密相关 **********************/

interface GetEncryptedDataRes {
  rqReturn?: LiuRqReturn
  newData?: Record<string, any>
}

/** 获取加密后的返回数据 */
export function getEncryptedData(
  oldData: Record<string, any>,
  vRes: VerifyTokenRes,
): GetEncryptedDataRes {
  const client_key = vRes?.tokenData?.client_key
  if(!client_key) {
    return {
      rqReturn: { 
        code: "E5001", 
        errMsg: "there is no client_key in getEncryptedData"
      }
    }
  }

  const keys = Object.keys(oldData)
  const newData: Record<string, any> = {}
  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    if(!k.startsWith("plz_enc_")) {
      newData[k] = oldData[k]
      continue
    }
    const newK = k.replace("plz_enc_", "liu_enc_")
    const val = oldData[k] as CryptoCipherAndIV
    const p1: LiuPlainText = {
      pre: client_key.substring(0, 5),
      nonce: createEncNonce(),
      data: val,
    }
    const p2 = objToStr(p1)
    const newVal = encryptWithAES(p2, client_key)
    if(!newVal) {
      return {
        rqReturn: { 
          code: "E4009", 
          errMsg: "encryptWithAES failed"
        }
      }
    }
    newData[newK] = newVal
  }

  return { newData }
}


function encryptWithAES(
  plainText: string,
  key: string,
) {
  const keyBuffer = Buffer.from(key, "base64")
  const ivBuffer = crypto.randomBytes(16)
  const iv = ivBuffer.toString("base64")

  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, ivBuffer)
  let encrypted = cipher.update(plainText, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  let tag: Buffer
  try {
    tag = cipher.getAuthTag()
  }
  catch(err) {
    console.warn("获取 tag 失败.......")
    console.log(err)
    return null
  }
  const encryptedDataWithTag = Buffer.concat([Buffer.from(encrypted, 'base64'), Buffer.from(tag)])
  const cipherText = encryptedDataWithTag.toString("base64")

  const res: CryptoCipherAndIV = {
    cipherText,
    iv,
  }

  return res
}


interface GetDecryptedBodyRes {
  rqReturn?: LiuRqReturn
  newBody?: Record<string, any>
}

/** 获取解密后的 body */
export function getDecryptedBody(
  oldBody: Record<string, any>,
  vRes: VerifyTokenRes,
): GetDecryptedBodyRes {
  const client_key = vRes?.tokenData?.client_key
  if(!client_key) {
    return {
      rqReturn: { 
        code: "E5001", 
        errMsg: "there is no client_key in getDecryptedBody"
      }
    }
  }

  const keys = Object.keys(oldBody)
  const newBody: Record<string, any> = {}
  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    if(!k.startsWith("liu_enc_")) {
      newBody[k] = oldBody[k]
      continue
    }
    const newK = k.replace("liu_enc_", "")
    const data = oldBody[k] as CryptoCipherAndIV
    const plainText = decryptWithAES(data, client_key)
    if(!plainText) {
      return {
        rqReturn: {
          code: "E4009",
          errMsg: "decryptWithAES failed",
        }
      }
    }

    const obj = strToObj(plainText) as LiuPlainText
    if(!obj) {
      return {
        rqReturn: {
          code: "E4009",
          errMsg: "we cannot parse plain text",
        }
      }
    }
    if(obj.pre !== client_key.substring(0, 5)) {
      return {
        rqReturn: {
          code: "E4009",
          errMsg: "pre is not equal to client_key's first 5 characters",
        }
      }
    }
    newBody[newK] = obj.data
  }

  return { newBody }
}



function decryptWithAES(
  civ: CryptoCipherAndIV,
  key: string,
) {
  const { iv, cipherText } = civ
  const keyBuffer = Buffer.from(key, "base64")
  const ivBuffer = Buffer.from(iv, "base64")

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer)

  // 分割 tag 和 data(密文)
  const tagLength = 16; // 16 字节的 tag 长度
  const encryptedBuffer = Buffer.from(cipherText, 'base64')
  const tag = encryptedBuffer.subarray(encryptedBuffer.length - tagLength)
  const data = encryptedBuffer.subarray(0, encryptedBuffer.length - tagLength)

  try {
    decipher.setAuthTag(tag)
  }
  catch(err) {
    console.warn("setAuthTag 异常......")
    console.log(err)
    console.log(" ")
    return null
  }

  let decrypted = ""
  try {
    decrypted = decipher.update(data, undefined, 'utf8')
    const lastWord = decipher.final('utf-8')
    decrypted += lastWord
  }
  catch(err) {
    console.warn("AES 解密失败.....")
    console.log(err)
    console.log(" ")
    return null
  }

  return decrypted
}



/************************** ip 查询相关 **********************/

/** 获取 ip 的 ISO 3166-1 代码 */
export function getIpArea(ctx: FunctionContext) {
  const ip = ctx.headers?.['x-real-ip']
  if(!ip || typeof ip !== "string") return
  const geo = geoip.lookup(ip)
  return geo?.country
}

/** 获取 ip 的 ISO 3166-1 & 3166-2 代码 
 *  以 `-` 减号字符进行连接
*/
export function getIpGeo(ctx: FunctionContext) {
  const ip = ctx.headers?.['x-real-ip']
  if(!ip || typeof ip !== "string") return
  const geo = geoip.lookup(ip)
  const c = geo?.country
  if(!c) return
  const r = geo?.region
  if(!r) return c
  return `${c}-${r}`
}


/********************* 工具函数 ****************/

// 字符串转对象
export function strToObj<T = any>(str: string): T {
  let res = {}
  try {
    res = JSON.parse(str)
  }
  catch(err) {}
  return res as T
}

// 对象转字符串
export function objToStr<T = any>(obj: T): string {
  let str = ``
  try {
    str = JSON.stringify(obj)
  }
  catch(err) {}
  return str
}


/********************* stripe 相关 ****************/

/**
 * stripe 的一些对象中的属性，有时候是 string 的 id 值
 * 有时候则是该属性对象，所以做一个嵌套的方法专门获取其 id
 * @param data 某对象下的属性“值”
 * @return 返回该对象的 id
 */
export function getIdFromStripeObj(data: any) {
  if(!data) return undefined
  if(typeof data === "string") {
    return data
  }
  const id = data?.id
  if(typeof id === "string") {
    return id
  }
}

export function getStripeInstance() {
  const _env = process.env
  const sk = _env.LIU_STRIPE_API_KEY
  if(!sk) return
  const stripe = new Stripe(sk)
  return stripe
}
