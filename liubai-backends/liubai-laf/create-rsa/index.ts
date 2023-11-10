import * as crypto from "crypto"

async function main() {
  const modulusLength = 4096
  
  console.log("starting to generate KeyPair.........", modulusLength)
  console.log(" ")

  console.time("ggg")
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })
  console.timeEnd("ggg")

  console.log(`publicKey:::`, publicKey.length)
  console.log(publicKey)
  console.log(` `)

  console.log(`privateKey:::`, privateKey.length)
  console.log(privateKey)
  console.log(` `)

}

main()