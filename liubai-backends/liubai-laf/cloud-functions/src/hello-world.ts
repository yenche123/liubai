
const code = `0000`

// 若后端关闭时，请对调上下方代码和注释
// const code = `B0001`

export async function main(ctx: FunctionContext) {
  console.log('Hello LB')
  
  if(code !== `0000`) {
    return { code }
  }

  const now = Date.now()
  const res = {
    code,
    data: {
      stamp: now,
    }
  }
  return res
}
