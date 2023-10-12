import cloud from '@lafjs/cloud'

export async function main(ctx: FunctionContext) {
  console.log('Ready to clear logs ---------->')
  // 数据库,删除全部日志
  const db = cloud.database();
  const res = await db.collection('__function_logs__').limit(10).get()
  console.log(res)

  return { data: 'hi, laf' }
}