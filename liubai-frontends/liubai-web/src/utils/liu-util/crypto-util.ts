// 加解密相关的函数


/** 将字符串转换为 ArrayBuffer */
function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function trimPemContents(
  str: string,
  direction: 1 | -1,      // 1: 由前往后; -1 由后往前
) {
  let initNum = direction === 1 ? 0 : (str.length - 1)

  for(let i=initNum; i < str.length && i >= 0; i += direction) {
    const v = str[i]
    if(v === "-" || v === "\n") {
      if(direction > 0) {
        str = str.substring(1)
        i--
      }
      else {
        str = str.substring(0, str.length - 1)
      }
      continue
    }
    break
  }
  return str
}


function getPemContents(
  pem: string,
  pemHeader: string,
  pemFooter: string,
) {
  let pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length)

  // 从前方开始扫描，过滤掉 "-" 和 "\n"
  pemContents = trimPemContents(pemContents, 1)

  // 从后方开始扫描
  pemContents = trimPemContents(pemContents, -1)
  
  return pemContents
}

/**
 * 导入 RSA 公钥，参考 
 * https://developer.mozilla.org/zh-CN/docs/Web/API/SubtleCrypto/importKey#%E5%AF%BC%E5%85%A5_subjectpublickeyinfo_%E6%A0%BC%E5%BC%8F%E7%9A%84%E5%AF%86%E9%92%A5
 * @param pem pem格式的公钥
 */
async function importRsaPublicKey(pem: string) {
  const pemHeader = "-----BEGIN PUBLIC KEY-----"
  const pemFooter = "-----END PUBLIC KEY-----"
  const pemContents = getPemContents(pem, pemHeader, pemFooter)

  let binaryDerString = ""
  let binaryDer: ArrayBuffer | undefined

  try {
    binaryDerString = window.atob(pemContents)
    binaryDer = str2ab(binaryDerString)
  }
  catch(err1) {
    console.warn("err1: ")
    console.log(err1)
    console.log(" ")
    return null
  }

  console.log("binaryDer: ")
  console.log(binaryDer)
  console.log(" ")

  let key: CryptoKey
  try {
    key = await window.crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    )
  }
  catch(err2) {
    console.warn(err2)
    console.log(err2)
    console.log(" ")
    return null
  }

  return key
}


function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  const byteArr = new Uint8Array(arrayBuffer)
  const byteStr = String.fromCharCode(...byteArr)
  const b64 = window.btoa(byteStr)
  return b64
}


/**
 * 使用 RSA 的公钥对明文进行加密
 * 返回 base64 格式的密文
 */
async function encryptWithRSA(
  publicKey: CryptoKey,
  plainText: string,
) {
  const enc = new TextEncoder()
  const encoded = enc.encode(plainText)

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" }, 
    publicKey, 
    encoded
  )
  
  const cipherStr = arrayBufferToBase64(cipherBuffer)
  return cipherStr
}

export default {
  importRsaPublicKey,
  encryptWithRSA,
}