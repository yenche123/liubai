import Compressor from 'compressorjs';
import type { LiuExif, ImageShow, LiuImageStore } from "~/types"
import liuUtil from '../liu-util';
import ider from '../basic/ider';
import { encode as blurhashEncode } from "blurhash";
import { getImgLayout } from "./tools/img-layout"
import type { Ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"

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


async function _getExifReader() {
  const ExifReader = await import("exifreader")
  return ExifReader
}


/**
 * 获取图片的 exif 信息
 *   为什么不在 getMetaDataFromFiles 里一并获取呢？
 *   因为 getMetaDataFromFiles 传入的 files 已经是压缩后的图片
 * @param files 图片原档
 */
async function extractExif(files: File[]) {
  const list: Array<LiuExif> = []

  const ExifReader = await _getExifReader()

  for(let i=0; i<files.length; i++) {
    const f = files[i]
    const mExif: LiuExif = {}

    try {
      const res = await ExifReader.load(f, { expanded: true })
      // console.log("exif: ")
      // console.log(res.exif)
      // console.log("gps: ")
      // console.log(res.gps)
      
      const gps = res.gps
      const exif = res.exif

      if(gps) {
        mExif.gps = {}
        const { Altitude, Latitude, Longitude } = gps
        mExif.gps.altitude = Altitude?.toFixed(2)
        mExif.gps.latitude = Latitude?.toFixed(9)
        mExif.gps.longitude = Longitude?.toFixed(9)
      }

      if(exif) {
        mExif.DateTimeOriginal = exif.DateTimeOriginal?.description
        mExif.HostComputer = (exif as any).HostComputer?.description
        mExif.Model = exif.Model?.description
      }
      
    }
    catch(err) {
      console.log("extract exif error:::")
      console.log(err)
    }

    // console.log("看一下 mExif: ")
    // console.log(mExif)
    // console.log(" ")

    list.push(mExif)
  }
  return list
}

/**
 * 压缩图片
 * @param files 图片 File 类型
 */
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
  const { width } = useWindowSize()
  let maxWidth = Math.floor(width.value * 2)
  if(maxWidth < 1280) maxWidth = 1280
  else if(maxWidth > 2560) maxWidth = 2560

  let quality = 0.9
  if(maxWidth < 1440) quality = 0.86
  else if(maxWidth < 2000) quality = 0.8
  else quality = 0.75

  const _excute = (a: CompressResolver) => {
    const checkOrientation = file.size < CHECK_ORIENTATION_POINT

    const opt = {
      strict: true,
      checkOrientation,
      maxWidth,
      quality,
      convertTypes: 'image/png,image/webp',
      convertSize: 1 * 1024 * 1024,   // 1mb 以上的 convertTypes 图片，都会被转成 JPEGs
      success(res: File) {        
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

async function getMetaDataFromFiles(
  files: File[],
  exifs?: LiuExif[],
) {
  const list: LiuImageStore[] = []

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

        const tmpRes = e.target?.result
        if(!tmpRes) {
          console.warn("reader onload 事件回调 不存在 e.target.result")
          console.log(e.target)
          console.log(" ")
          a({ file })
          return
        }

        _calc(a, tmpRes as string)
      }
      reader.onerror = (e: ProgressEvent<FileReader>) => {
        console.warn("reader onerror 事件被触发.........")
        console.log(e)
        a({ file })
      }
    }
    return new Promise(_read)
  }

  const _pack = async (
    data: FileWithCharacteristic,
    exif?: LiuExif
  ) => {
    const w = data.width
    const h = data.height
    let h2w = w && h ? (h / w).toFixed(2) : undefined
    let arrayBuffer: ArrayBuffer
    try {
      arrayBuffer = await data.file.arrayBuffer()
    }
    catch(err) {
      console.log("arrayBuffer() err: ")
      console.log(err)
      return null
    }

    const obj: LiuImageStore = {
      id: ider.createImgId(),
      name: data.file.name,
      lastModified: data.file.lastModified,
      mimeType: data.file.type,
      arrayBuffer,
      width: w,
      height: h,
      h2w,
      blurhash: data.blurhash,
      someExif: exif,
    }
    return obj
  }

  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const mExif = exifs?.[i]
    const res = await _get(v)
    const res2 = await _pack(res, mExif)
    if(res2) list.push(res2)
  }
  return list
}

// 由于 blurhash 的 encode 方法在图片尺寸大时非常消耗性能，计算时间可能长达 5000ms
// 所以这里做一下缩小图片尺寸的处理，把宽高限制在一定范围内
function _resizeDimensions(img: HTMLImageElement) {
  const { width, height } = img
  const { maxHeight, maxWidth } = BlurhashEncoding 
  return liuUtil.constraintWidthHeight(width, height, maxWidth, maxHeight)
}

function imageStoreToShow(val: LiuImageStore): ImageShow {
  let [src] = liuUtil.createURLsFromStore([val])
  const obj: ImageShow = {
    src,
    id: val.id,
    width: val.width,
    height: val.height,
    h2w: val.h2w,
    blurhash: val.blurhash,
  }
  return obj
}

// 当逻辑层的 images 变化时，响应到 coversRef 视图层上
function whenImagesChanged(
  coversRef: Ref<ImageShow[]>,
  newImages?: LiuImageStore[],
) {
  const newLength = newImages?.length ?? 0
  if(newLength < 1) {
    if(coversRef.value.length > 0) coversRef.value = []
    return
  }

  (newImages as LiuImageStore[]).forEach((v, i) => {
    const v2 = coversRef.value[i]
    if(!v2) {
      coversRef.value.push(imageStoreToShow(v))
    }
    else if(v2.id !== v.id) {
      coversRef.value[i] = imageStoreToShow(v)
    }
  })

  // 删除多余的项
  const length2 = coversRef.value.length
  const diffLength = length2 - newLength
  if(diffLength > 0) {
    coversRef.value.splice(newLength, diffLength)
  }
}

export default {
  extractExif,
  compress,
  getMetaDataFromFiles,
  imageStoreToShow,
  getImgLayout,
  whenImagesChanged,
}