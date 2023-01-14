import Compressor from 'compressorjs';
import type { ImageLocal, ImageShow } from "../../types"
import liuUtil from '../liu-util';
import ider from '../basic/ider';
import { encode as blurhashEncode } from "blurhash";

type FileWithCharacteristic = { 
  file: File
  width?: number
  height?: number
  blurhash?: string
}
type CompressResolver = (res: File) => void
type WidthHeightResolver = (res: FileWithCharacteristic) => void

// 临界值，处于该值以上的 size 才需要压缩
const COMPRESS_POINT = 300 * 1024    // 300 kb

const NO_COMPRESS_TYPES = ["image/gif"]

const CHECK_ORIENTATION_POINT = 5 * 1024 * 1024   // 5mb 以下才去 checkOrientation

const BlurhashEncoding = {
  componentX: 4,     // blurhash 的水平轴精度
  componentY: 3,     // blurhash 的纵轴精度
  maxWidth: 32,
  maxHeight: 32,
}

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

    const _blurhash = (
      a: WidthHeightResolver, 
      tmpRes: FileWithCharacteristic,
      img: HTMLImageElement,
    ) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const context = canvas.getContext("2d")

      if(!context) {
        console.log("生成 2d canvas 失败..........")
        a(tmpRes)
        return
      }

      const { width, height } = _resizeDimensions(img)

      // console.log("新的宽度: ", width)
      // console.log("新的高度: ", height)
      // console.log(" ")

      context.drawImage(img, 0, 0, width, height)
      const imgData = context.getImageData(0, 0, width, height)
      const { componentX, componentY } = BlurhashEncoding

      // console.time("blurhash")
      const blurhash = blurhashEncode(
        imgData.data, 
        imgData.width, 
        imgData.height, 
        componentX,
        componentY,
      )
      // console.timeEnd("blurhash")

      // console.log("看一下 blurhash: ", blurhash)
      tmpRes.blurhash = blurhash
      a(tmpRes)
    }

    const _calc = (a: WidthHeightResolver, base64: string) => {
      const img = new Image()
      img.onload = () => {
        const w = img.width
        const h = img.height
        _blurhash(a, { width: w, height: h, file }, img)
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

  const _pack = (data: FileWithCharacteristic) => {
    const w = data.width
    const h = data.height
    let h2w = w && h ? (h / w).toFixed(2) : undefined
    const obj: ImageLocal = {
      id: ider.createImgId(),
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

// 由于 blurhash 的 encode 方法在图片尺寸大时非常消耗性能，计算时间可能长达 5000ms
// 所以这里做一下缩小图片尺寸的处理，把宽高限制在一定范围内
function _resizeDimensions(img: HTMLImageElement) {
  const { width, height } = img
  const { maxHeight, maxWidth } = BlurhashEncoding 
  if (width > maxWidth && width > height) {
    return {
      width: maxWidth,
      height: height * (maxWidth / width)
    }
  } else if (height > maxHeight) {
    return {
      width: width * (maxHeight / height),
      height: maxHeight
    }
  }
  return { width, height }
}

function imageLocalToShow(val: ImageLocal): ImageShow {
  const obj: ImageShow = {
    src: val.file ? liuUtil.createObjURLs([val.file])[0] : (val.cloud_url ?? ""),
    id: val.id,
    width: val.width,
    height: val.height,
    h2w: val.h2w
  }
  return obj
}

export default {
  compress,
  getMetaDataFromFiles,
  imageLocalToShow,
}