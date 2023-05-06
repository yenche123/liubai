// 一些文字过长时，做一些处理

/**
 * 文件名过长时，使用 js 做一些裁切处理，
 * 使之呈现诸如 "abc.....xyz.type" 貌的文字
 * @param fileName 文件名
 * @param breakpoint 断点位置
 */
function trimFileName(
  fileName: string,
  breakpoint: number = 22,
) {
  let len = fileName.length
  if(len < breakpoint) return fileName
  let res = fileName.substring(0, 12) + "......"
  res += fileName.substring(len - 7)
  return res
}

export default {
  trimFileName,
}
