import cloud from '@lafjs/cloud'

export async function main(ctx: FunctionContext) {
  console.log('Hello World')
  
  const date = new Date()
  const timezoneOffset = date.getTimezoneOffset()
  const utcString = date.toUTCString()
  const localeDateString = date.toLocaleDateString()
  const localeTimeString = date.toLocaleTimeString()
  const now = date.getTime()

  console.log(`timezoneOffset: `, timezoneOffset)
  console.log(`utcString: `, utcString)
  console.log(`localeDateString: `, localeDateString)
  console.log(`localeTimeString: `, localeTimeString)
  console.log(`now: `, now)
  

  return { data: 'hi, laf' }
}
