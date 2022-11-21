import valTool from "./val-tool"

let diff = 0

const _init = async (): Promise<void> => {
  
}

_init()

// 经过标定的时间
const getTime = (): number => {
  return Date.now() + diff
}

// 返回未经过标定的时间
const getLocalTime = (): number => {
  return Date.now()
}

// 返回经过标定的 Date
const getDate = () => {
  return new Date(getTime())
}

// 返回当前时间的字符串
const getLocalTimeStr = (): string => {
  let t = getTime()
  const d = new Date(t)
  const mon = valTool.format0(d.getMonth()+1)
  const date = valTool.format0(d.getDate())
  const hr = valTool.format0(d.getHours())
  const min = valTool.format0(d.getMinutes())
  const sec = valTool.format0(d.getSeconds())
  return `${mon}-${date} ${hr}:${min}:${sec}`
}


export default {
  getTime,
  getLocalTime,
  getDate,
  getLocalTimeStr
}