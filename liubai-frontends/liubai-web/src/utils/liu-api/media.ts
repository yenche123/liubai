
// 对 MediaDevices (https://developer.mozilla.org/zh-CN/docs/Web/API/MediaDevices)
// 做一层封装

// 列举 可用的设备
const enumerateDevices = () => {
  const res = navigator.mediaDevices.enumerateDevices()
  return res
}

// 请求设备录音、录视频的 api
const getUserMedia = (constraints: MediaStreamConstraints) => {
  const res = navigator.mediaDevices.getUserMedia(constraints)
  return res
}

// 选择屏幕、窗口进行捕获，即录屏的 api
const getDisplayMedia = (constraints: MediaStreamConstraints) => {
  const res = navigator.mediaDevices.getDisplayMedia(constraints)
  return res
}

// 返回支持的约束
const getSupportedConstraints = () => {
  const res = navigator.mediaDevices.getSupportedConstraints()
  return res
}

export default {
  enumerateDevices,
  getUserMedia,
  getDisplayMedia,
  getSupportedConstraints,
}