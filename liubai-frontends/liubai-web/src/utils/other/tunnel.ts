import valTool from "../basic/val-tool"

let _tunnelData: any = undefined

function setData<T = any>(data: T) {
  const tp = typeof data
  if(tp === "boolean" || tp === "number" || tp === "undefined") {
    _tunnelData = data
  }
  else if(tp === "object") {
    _tunnelData = valTool.copyObject(data)
  }
  else {
    console.warn("不支持该类型的数据传递.......")
    return false
  }
  _tunnelData = data
  return true
}

function getData<T = any>(): T | undefined {
  const tp = typeof _tunnelData
  if(tp === "boolean" || tp === "number" || tp === "undefined") {
    const res = _tunnelData
    _tunnelData = undefined
    return res
  }
  if(tp === "object") {
    const res2 = valTool.copyObject(_tunnelData)
    _tunnelData = undefined
    return res2
  }
}

export default {
  setData,
  getData,
}