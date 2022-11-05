import Compressor from 'compressorjs';
import type { ImageLocal } from "../../types"
import { customAlphabet } from 'nanoid'

type FileWithWH = { file: File, width?: number, height?: number }
type CompressResolver = (res: File) => void
type WidthHeightResolver = (res: FileWithWH) => void

// 临界值，处于该值以上的 size 才需要压缩
const COMPRESS_POINT = 300 * 1024    // 300 kb

const NO_COMPRESS_TYPES = ["image/gif"]

const CHECK_ORIENTATION_POINT = 5 * 1024 * 1024   // 5mb 以下才去 checkOrientation

async function compress(files: File[]) {
  const list: Array<File> = []
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

async function getMetaDataFromFiles(files: File[]) {
  const list: ImageLocal[] = []

  const _get = (file: File) => {

    const _calc = (a: WidthHeightResolver, base64: string) => {
      const img = new Image()
      img.onload = () => {
        const w = img.width
        const h = img.height
        a({ width: w, height: h, file })
      }
      img.onerror = (e: Event | string) => {
        console.warn("图片计算错误........")
        console.log(e)
        console.log(" ")
        a({ file })
      }
      img.src = base64
    }

    const _read = (a: WidthHeightResolver) => {
      let reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e: ProgressEvent<FileReader>) => {

        if(!e.target?.result) {
          console.warn("reader onload 事件回调 不存在 e.target.result")
          console.log(e.target)
          console.log(" ")
          a({ file })
          return
        }

        _calc(a, e.target.result as string)
      }
      reader.onerror = (e: ProgressEvent<FileReader>) => {
        console.warn("reader onerror 事件被触发.........")
        console.log(e)
        a({ file })
      }
    }
    return new Promise(_read)
  }

  const _pack = (data: FileWithWH) => {
    const w = data.width
    const h = data.height
    let h2w = w && h ? (h / w).toFixed(2) : undefined
    const obj: ImageLocal = {
      id: _createId(),
      name: data.file.name,
      lastModified: data.file.lastModified,
      file: data.file,
      width: w,
      height: h,
      h2w,
    }
    return obj
  }

  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const res = await _get(v)
    list.push(_pack(res))
  }
  return list
}

function _createId() {
  const ABC = "0123456789abcdefghijkmnopqrstuvwxyz"
  const nanoid = customAlphabet(ABC, 23)
  return nanoid()
}

export default {
  compress,
  getMetaDataFromFiles,
}