



export function getAcceptImgTypes() {
  return "image/png,image/jpg,image/jpeg,image/gif,image/webp"
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