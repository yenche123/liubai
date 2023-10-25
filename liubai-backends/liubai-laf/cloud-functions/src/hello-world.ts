import geoip from "geoip-lite"

export async function main(ctx: FunctionContext) {

  const ip = ctx.headers?.['x-real-ip']
  if(typeof ip === 'string') {
    console.log(`ip: `, ip)
    const geo = geoip.lookup(ip)
    if(geo) {
      console.log("IP Geo: ", geo.region, geo.country)
      console.log("IP timezone: ", geo.timezone)
    }
  }

  const now = Date.now()
  const res = {
    code: `0000`,
    data: {
      stamp: now,
    }
  }
  return res
}
