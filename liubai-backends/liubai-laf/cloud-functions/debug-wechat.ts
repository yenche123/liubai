import cloud from '@lafjs/cloud'

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  console.log("hello world!")
  return { code: "0000" }
}


function testWeChatAccessToken() {
  
}