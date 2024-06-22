import { type Ref, shallowRef, watch, onBeforeUnmount } from 'vue';
import { type LiuTimeout } from '~/utils/basic/type-tool';

interface IOptions {
  light?: {
    width?: number
    height?: number
    color?: string
    blur?: number
  }
  show?: Ref<boolean>
}

/**
 * @see https://mp.weixin.qq.com/s/hZUX7PCDGQj6Ih8_dWzb1w
 */
export const useLightBox = (
  option?: IOptions,
) => {
  // 当前鼠标是否在卡片内
  const isCursorIn = shallowRef(false)

  // 获取卡片的dom节点
  const cardRef = shallowRef<HTMLDivElement | null>(null)
  // 光的dom节点
  const lightRef = shallowRef<HTMLDivElement>(document.createElement('div'))

  // 设置光源的样式
  const setLightStyle = () => {
    const { 
      width = 60, 
      height = 60, 
      color = 'var(--light-box)', 
      blur = 38,
    } = option?.light ?? {}
    const lightDom = lightRef.value
    lightDom.style.position = 'absolute'
    lightDom.style.width = `${width}px`
    lightDom.style.height = `${height}px`
    lightDom.style.background = color
    lightDom.style.filter = `blur(${blur}px)`
    lightDom.style.pointerEvents = 'none'
  };

  // 往卡片添加光源
  const addLight = () => {
    const cardDom = cardRef.value
    if (cardDom) {
      cardDom.insertBefore(lightRef.value, cardDom.firstChild)
    }
  }

  // 删除光源
  const removeLight = () => {
    const cardDom = cardRef.value
    if (cardDom) {
      cardDom.removeChild(lightRef.value)
    }
  }

  let timeout: LiuTimeout
  
  // 监听卡片的鼠标移动
  const onMouseMove = (e: MouseEvent) => {
    // 获取鼠标的坐标
    const { clientX, clientY } = e
    // 让光跟随鼠标
    const cardDom = cardRef.value
    const lightDom = lightRef.value
    if(!cardDom) return

    // 获取卡片相对于窗口的x和y坐标
    const { x, y, width: w0, height: h0 } = cardDom.getBoundingClientRect()
    // 获取光的宽高
    const { width: w1, height: h1 } = lightDom.getBoundingClientRect()

    const radiusX = w1 / 2
    const radiusY = h1 / 2
    const cursorX = clientX - x
    const cursorY = clientY - y

    // 1. 设置光的位置
    lightDom.style.left = `${cursorX - radiusX}px`;
    lightDom.style.top = `${cursorY - radiusY}px`;

    // 2. 设置动画效果
    const maxXRotation = 6; // X 轴旋转角度
    const maxYRotation = 3; // Y 轴旋转角度

    const rangeX = h0 / 2; // X 轴旋转的范围
    const rangeY = w0 / 2; // Y 轴旋转的范围

    const rotateX = (cursorY - rangeX) / rangeX * maxXRotation
    const rotateY = -1 * (cursorX - rangeY) / rangeY * maxYRotation

    //设置 3D 透视
    const str = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    if(timeout) {
      if(!cardDom.style.transform) {
        cardDom.style.transform = str
      }
      return
    }
    cardDom.style.transform = str    
  }
  

  const _whenMouseEnter = () => {
    isCursorIn.value = true
    if(timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
  }

  // 监听卡片的鼠标移入
  const onMouseEnter = (e: MouseEvent) => {
    addLight()
    _whenMouseEnter()
    onMouseMove(e)
  }

  const _whenMouseLeave = () => {
    const cardDom = cardRef.value
    if(!cardDom) return
    cardDom.style.transition = ".25s"
    cardDom.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`
    if(timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      timeout = undefined
      isCursorIn.value = false

      if(!cardDom) return
      cardDom.style.removeProperty("transition")
      cardDom.style.removeProperty("transform")
    }, 275)
  }

  // 监听卡片鼠标移出
  const onMouseLeave = () => {
    // 鼠标离开移出光源
    removeLight()
    _whenMouseLeave()
  }

  const _start = () => {
    setLightStyle()
    cardRef.value?.addEventListener('mouseenter', onMouseEnter)
    cardRef.value?.addEventListener('mousemove', onMouseMove)
    cardRef.value?.addEventListener('mouseleave', onMouseLeave)
  }

  const _end = () => {
    isCursorIn.value = false
    cardRef.value?.removeEventListener('mouseenter', onMouseEnter)
    cardRef.value?.removeEventListener('mousemove', onMouseMove)
    cardRef.value?.removeEventListener('mouseleave', onMouseLeave)
  }

  watch(cardRef, (newV) => {
    if(newV) _start()
  })

  if(option?.show) {
    watch(option.show, (newV) => {
      if(!newV) _end()
    })
  }

  onBeforeUnmount(() => {
    _end()
  })

  return {
    isCursorIn,
    cardRef,
  }
}