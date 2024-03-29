


export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}

  console.log("接收到七牛云的回调............")
  console.log(body)
  console.log("看一下 ctx: ")
  console.log(ctx)

  return { code: "0000" }
}