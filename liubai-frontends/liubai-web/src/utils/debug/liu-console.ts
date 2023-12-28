
import time from "../basic/time"

const showNowStamp = () => {
  const s = time.getTime()
  console.log(`%c当前时间戳: %c${s}`, "color: #666;", "color: #8888cc;")
}


export default {
  showNowStamp,
}