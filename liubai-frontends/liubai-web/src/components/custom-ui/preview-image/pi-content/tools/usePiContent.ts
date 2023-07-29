import { toRef, watch, ref, computed } from 'vue';
import type { Ref } from "vue";
import { useWindowSize } from '~/hooks/useVueUse';
import type { ImageShow } from '~/types';
import type { LiuTimeout } from '~/utils/basic/type-tool';
import type { PicProps, PicCover, PicEmits, PicCtx } from './types';
import type { ZoomEvents } from "swiper/types"
import time from '~/utils/basic/time';

export function usePiContent(
  props: PicProps,
  emit: PicEmits
) {

  const covers = ref<PicCover[]>([])
  const coverLength = computed(() => covers.value.length)
  const { width, height } = useWindowSize()
  const imgsRef = toRef(props, "imgs")
  const zoomScale = ref(1)

  const ctx: PicCtx = {
    props,
    emit,
    zoomScale,
  }

  let timeout: LiuTimeout
  watch([imgsRef, width, height], (newV) => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = undefined
      calcImages(covers, imgsRef.value, width.value, height.value)
    }, 300)
  })

  calcImages(covers, imgsRef.value, width.value, height.value)

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

  return { 
    covers, 
    coverLength,
    onZoomChange,
    onBoxPointerDown,
    onBoxPointerUp,
  }
}


let waitingToCancel: LiuTimeout
let lastTapBox = 0
let lastPointerDown = 0
let lastClientX = 0
let lastClientY = 0
function whenZoomChange() {
  if(waitingToCancel) clearInterval(waitingToCancel)
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
  const now = time.getTime()
  const diff = now - lastPointerDown

  // console.log("间隔: ", diff)
  // 注意: 在触控板上点击，通常会大于 200ms
  // 介于 200ms ~ 250ms 之间
  if(diff > 300) {
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
  const now = time.getTime()
  const diff2 = now - lastTapBox
  if(diff2 < 400) return
  lastTapBox = now

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
  imgs: ImageShow[],
  w: number,
  h: number
){
  const newList: PicCover[] = []
  const v_h2w = h / w

  for(let i=0; i<imgs.length; i++) {
    const v = imgs[i]
    const { width, height, h2w, id, src, blurhash } = v

    if(width && height && width <= w && height <= h) {
      newList.push({ id, src, width, height, blurhash })
      continue
    }

    const obj: PicCover = {
      id,
      src,
      width: width ? Math.min(width, w) : w,
      height: height ? Math.min(height, h) : h,
      blurhash,
    }
    
    const img_h2w = Number(h2w)
    if(!h2w || isNaN(img_h2w)) {
      newList.push(obj)
      continue
    }

    // 如果窗口的高宽比 >= 图片的，那么图片的宽就等于窗口的宽
    if(v_h2w >= img_h2w) {
      obj.width = Math.round(w)
      obj.height = Math.round(w * img_h2w)
      newList.push(obj)
      continue
    }

    // 否则 图片的高就等于窗口的高
    obj.height = Math.round(h)
    obj.width = Math.round(h / img_h2w)
    newList.push(obj)
  }

  // console.log("看一下计算出来的 covers: ")
  // console.log(newList)
  // console.log(" ")
  covers.value = newList
}