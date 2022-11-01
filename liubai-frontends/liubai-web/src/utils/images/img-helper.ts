import Compressor from 'compressorjs';

type CompressResolver = (res: File | Blob) => void

// 临界值，处于该值以上的 size 才需要压缩
const COMPRESS_POINT = 300 * 1024    // 300 kb

const NO_COMPRESS_TYPES = ["image/gif"]

const CHECK_ORIENTATION_POINT = 5 * 1024 * 1024   // 5mb 以下才去 checkOrientation

async function compress(files: FileList) {
  const list: Array<Blob | File> = []
  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const noCompress = NO_COMPRESS_TYPES.includes(v.type)
    if(v.size < COMPRESS_POINT || noCompress) {
      list.push(v)
      continue
    }
    const res = await _toCompress(v)
    list.push(res)
  }
  return list
}

function _toCompress(file: File) {

  const _excute = (a: CompressResolver) => {
    const checkOrientation = file.size < CHECK_ORIENTATION_POINT

    const opt = {
      strict: true,
      checkOrientation,
      maxWidth: 1280,
      quality: 0.86,
      convertTypes: 'image/png,image/webp',
      convertSize: 1 * 1024 * 1024,   // 1mb 以上的 convertTypes 图片，都会被转成 JPEGs
      success(res: File) {
        console.log("压缩成功...........")
        a(res)
      },
      error(err: Error) {
        console.log("发生了压缩错误.......")
        console.log(err)
        console.log(" ")
        a(file)
      }
    }

    new Compressor(file, opt)
  }

  return new Promise(_excute)
}


export default {
  compress,
}