import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"



export function useSubscribeContent() {

  const onTapBtn = async () => {
    const url = APIs.STRIPE_TEST

    console.log("去测试 stripe...............")
    const res = await liuReq.request(url)
    console.log("res: ")
    console.log(res)
    if(res.code !== "0000") return
    const stripeUrl = res.data?.session?.url
    if(stripeUrl) {
      location.href = stripeUrl
    }
  }


  return {
    onTapBtn
  }

}