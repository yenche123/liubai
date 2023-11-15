// 存放一些公共函数
import cloud from '@lafjs/cloud'
import * as crypto from "crypto"

export async function main(ctx: FunctionContext) {
  console.log("do nothing with common-util")
  return true
}

/**
 * 使用 RSA 的密钥解密数据
 * @param encryptedText base64 格式的密文
 */
export function decryptWithRSA(encryptedText: string) {
  const pk = getPrivateKey()
  if(!pk) {
    return { err: "no private key" }
  }

  const privateKeyObj = crypto.createPrivateKey({
    key: pk,
    format: 'pem',
    type: 'pkcs8',
  })

  console.log("encryptedText: ")
  console.log(encryptedText)
  console.log(" ")

  const buffer = Buffer.from(encryptedText, "utf-8")
  console.log("buffer: ")
  console.log(buffer)
  console.log(" ")

  try {
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKeyObj,
        oaepHash: "SHA256"
      },
      buffer
    )
    const plainText = decryptedData.toString('utf8')
    console.log("plainText: ")
    console.log(plainText)
    console.log(" ")
  }
  catch(err1) {
    console.warn("解密失败........")
    console.log(err1)
    console.log(" ")
  }

  return { msg: "先这样" }
}


function getPrivateKey() {
  const keyPair = cloud.shared.get(`liu-rsa-key-pair`)
  const privateKey = keyPair?.privateKey
  if(!privateKey) return undefined
  return privateKey as string
}

