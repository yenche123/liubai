import { toRef, watch, ref, computed, type Ref } from 'vue';
import { useDebounceFn, useWindowSize } from '~/hooks/useVueUse';
import type { ImageShow } from '~/types';
import type { LiuTimeout } from '~/utils/basic/type-tool';
import type { PicProps, PicCover, PicEmits, PicCtx, PicSwiperParams } from './types';
import type { ZoomEvents } from "swiper/types"
import { Zoom, Mousewheel, Keyboard } from "swiper/modules"
import time from '~/utils/basic/time';
import liuApi from '~/utils/liu-api';
import type { LiuImgData } from '~/types/types-view';

export function usePiContent(
  props: PicProps,
  emit: PicEmits
) {

  const swiperParams = initSwiperParams()
  const covers = ref<PicCover[]>([])
  const coverLength = computed(() => covers.value.length)
  const { width, height } = useWindowSize()
  const imgsRef = toRef(props, "imgs")
  const imgDatas = ref<Array<LiuImgData | undefined>>([])
  const zoomScale = ref(1)

  const ctx: PicCtx = {
    props,
    emit,
    zoomScale,
  }

  const debounceCalc = useDebounceFn(() => {
    calcImages(covers, imgDatas, imgsRef.value, width.value, height.value)
  }, 300)
  watch([imgsRef, imgDatas, width, height], debounceCalc)
  calcImages(covers, imgDatas, imgsRef.value, width.value, height.value)

  const onZoomChange: ZoomEvents['zoomChange'] = (
    swiper,
    scale,
    imageEl,
    slideEl,
  ) => {
    ctx.swiper = swiper
    ctx.zoomScale.value = scale
    whenZoomChange()
  }

  const onBoxPointerDown = (evt: PointerEvent) => {
    whenBoxPointerDown(evt)
  }

  const onBoxPointerUp = (evt: PointerEvent) => {
    whenBoxPointerUp(ctx, evt)
  }

  const onImgLoaded = (index: number, data: LiuImgData) => {
    calculateImgDatas(imgDatas, imgsRef, index, data)
  }

  return { 
    swiperParams,
    covers, 
    coverLength,
    onZoomChange,
    onBoxPointerDown,
    onBoxPointerUp,
    onImgLoaded,
  }
}


function calculateImgDatas(
  imgDatas: Ref<Array<LiuImgData | undefined>>,
  imgsRef: Ref<ImageShow[]>,
  index: number,
  img: LiuImgData,
) {
  const list1 = imgDatas.value
  const list2 = imgsRef.value
  const len1 = list1.length
  const len2 = list2.length
  if(index >= len2) return
  if(len1 !== len2) {
    imgDatas.value = new Array(len2)
  }
  imgDatas.value[index] = img
}

function initSwiperParams() {
  const cha = liuApi.getCharacteristic()
  const swiperParams: PicSwiperParams = {
    modules: [Zoom],
    zoom: true,
    cssMode: false,
    mousewheel: false,
    keyboard: false,
  }

  if(cha.isPC) {
    swiperParams.modules.push(Mousewheel, Keyboard)
    swiperParams.cssMode = true
    swiperParams.mousewheel = { forceToAxis: true }
    swiperParams.keyboard = true
  }

  return swiperParams
}


let waitingToCancel: LiuTimeout
let lastTapBox = 0
let lastPointerDown = 0
let lastClientX = 0
let lastClientY = 0
function whenZoomChange() {
  if(waitingToCancel) clearTimeout(waitingToCancel)
}

function whenBoxPointerDown(evt: PointerEvent) {
  lastPointerDown = time.getTime()
  const { clientX, clientY } = evt
  lastClientX = clientX
  lastClientY = clientY
}

function checkIfTap(
  evt: PointerEvent,
) {

  // 确保是鼠标左键触发的
  if(evt.button !== 0) return false

  // 注意: 在触控板上点击，通常会大于 200ms
  // 介于 200ms ~ 250ms 之间，所以取 300ms 比较保险
  if(!time.isWithinMillis(lastPointerDown, 300)) {
    return false
  }

  const { clientX, clientY } = evt
  const x2 = (clientX - lastClientX) ** 2     // ** 表示指数计算
  const y2 = (clientY - lastClientY) ** 2
  const distance = Math.sqrt(x2 + y2)
  if(distance < 16) return true
  return false
}

function whenBoxPointerUp(
  ctx: PicCtx,
  evt: PointerEvent,
) {
  // 1. 判断是不是点击事件
  if(!checkIfTap(evt)) return
  
  // 2. 判断是不是连续点击，若是忽略
  if(time.isWithinMillis(lastTapBox, 400)) return
  lastTapBox = time.getTime()

  waitingToCancel = setTimeout(() => {
    waitingToCancel = undefined
    
    const scale = ctx.zoomScale.value
    const swiper = ctx.swiper
    // console.log("当前缩放尺寸: ", scale)

    if(scale > 1 && swiper) {
      swiper.zoom.toggle()
    }
    else {
      ctx.emit('cancel')
    }

  }, 300)
}

/**
 * 计算图片的宽高
 * @param covers 绑定到视图上的响应式图片数据
 * @param imgs  纯数组
 * @param w 视口宽度
 * @param h 视口高度
 */
function calcImages(
  covers: Ref<ImageShow[]>,
  imgDatas: Ref<Array<LiuImgData | undefined>>,
  imgs: ImageShow[],
  w: number,
  h: number
){
  const newList: PicCover[] = []
  const v_h2w = h / w
  const datas = imgDatas.value

  for(let i=0; i<imgs.length; i++) {
    const v = imgs[i]
    const d = datas[i]
    const { width, height, h2w, id, src, blurhash } = v

    if(width && height && width <= w && height <= h) {
      newList.push({ id, src, width, height, blurhash })
      continue
    }

    const nW = d?.naturalWidth
    const nH = d?.naturalHeight
    const _w = width ?? nW
    const _h = height ?? nH

    const obj: PicCover = {
      id,
      src,
      width: _w ? Math.min(_w, w) : w,
      height: _h ? Math.min(_h, h) : h,
      blurhash,
    }
    
    let img_h2w = Number(h2w)
    if(!h2w || isNaN(img_h2w)) {
      if(_w && _h) {
        img_h2w = _h / _w
      }
      if(!img_h2w || isNaN(img_h2w)) {
        newList.push(obj)
        continue
      }
    }

    // 如果窗口的高宽比 >= 图片的，那么图片的宽就等于窗口的宽
    if(v_h2w >= img_h2w) {
      obj.height = Math.round(obj.width * img_h2w)
      newList.push(obj)
      continue
    }

    // 否则 图片的高就等于窗口的高
    obj.width = Math.round(obj.height / img_h2w)
    newList.push(obj)
  }

  // console.log("看一下计算出来的 covers: ")
  // console.log(newList)
  // console.log(" ")
  covers.value = newList
}