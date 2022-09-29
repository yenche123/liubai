


export const share = async (data?: ShareData): Promise<boolean> => {
  if(!navigator.share) {
    return false
  }
  console.log("share.............")
  console.log(data)
  console.log(" ")
  try {
    const res = await navigator.share(data)
    console.log("分享成功.........")
    console.log(res)
    console.log(" ")
  }
  catch(err) {
    console.log("分享失败了......")
    console.log(err)
    console.log(" ")
    return false
  }
  return true
}


export const canShare = (data: ShareData): boolean => {
  if(!navigator.share) return false
  if(!navigator.canShare) return false
  return navigator.canShare(data)
}