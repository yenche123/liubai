import * as crypto from "crypto"

export async function main(ctx: FunctionContext) {
  console.log("welcome to debug-aes hahaha")
  
  // const key = crypto.randomBytes(32)    // 32 字节 = 256 位
  // const iv = crypto.randomBytes(16)    // 16 字节 = 128 位

  return true
}


function encryptWithAES(
  plainText: string,
  key: string,
  iv: string,
) {
  const keyBuffer = Buffer.from(key, "base64")
  const ivBuffer = Buffer.from(iv, "base64")
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
  return cipherText
}


function decryptWithAES(
  cipherText: string,
  key: string,
  iv: string,
) {
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
