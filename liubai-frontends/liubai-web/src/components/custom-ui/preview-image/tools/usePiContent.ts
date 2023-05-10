import { toRef, watch, ref, computed } from 'vue';
import type { Ref } from "vue";
import { useWindowSize } from '~/hooks/useVueUse';
import type { ImageShow } from '~/types';
import type { LiuTimeout } from '~/utils/basic/type-tool';

interface PicProps {
  imgs: ImageShow[]
  currentIndex: number
  viewTransitionName?: string
}

export const picProps = {
  imgs: {
    type: Array<ImageShow>,
    default: [],
  },
  currentIndex: {
    type: Number,
    default: 0,
  },
  viewTransitionName: {
    type: String,
  }
}

interface PicCover {
  src: string
  id: string
  width: number
  height: number
  blurhash?: string
}

export function usePiContent(props: PicProps) {

  const covers = ref<PicCover[]>([])
  const coverLength = computed(() => covers.value.length)
  const { width, height } = useWindowSize()
  const imgsRef = toRef(props, "imgs")

  let timeout: LiuTimeout
  watch([imgsRef, width, height], (newV) => {
    if(timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = undefined
      calcImages(covers, imgsRef.value, width.value, height.value)
    }, 300)
  })

  calcImages(covers, imgsRef.value, width.value, height.value)

  return { covers, coverLength }
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