


// 获取允许的图片类型 由 , 拼接而成的字符串
export function getAcceptImgTypesString() {
  return "image/png,image/jpg,image/jpeg,image/gif,image/webp"
} 

export function getAcceptImgTypesArray() {
  const str = getAcceptImgTypesString()
  return str.split(",")
}

export function createObjURLs(files: Array<Blob | File>): string[] {
  const list = []
  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const res = URL.createObjectURL(v)
    list.push(res)
  }

  return list
}

export function getArrayFromFileList(fileList: FileList): File[] {
  const arr: File[] = []
  for(let i=0; i<fileList.length; i++) {
    const v = fileList[i]
    arr.push(v)
  }
  return arr
}

/**
 * 从文件中获取图片类型的文件，并且不会改变原数组
 */
export function getOnlyImageFiles(files: File[]): File[] {
  const imgFiles: File[] = []
  const arr = getAcceptImgTypesArray()
  for(let i=0; i<files.length; i++) {
    const v = files[i]
    if(arr.includes(v.type)) imgFiles.push(v)
  }
  return imgFiles
}