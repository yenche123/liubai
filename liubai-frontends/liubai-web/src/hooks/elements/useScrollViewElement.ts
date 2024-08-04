import { onActivated, onMounted, onUnmounted } from "vue"

export type SveOnScrolling = (sT: number) => void

export interface SveOpt {
  onScrolling?: SveOnScrolling
  isTop?: boolean
}


export function useScrollViewElement(
  selectors: string,
  opt?: SveOpt,
) {
  const isTop = opt?.isTop ?? true
  let sv: HTMLElement | null = null
  let lastScrollPosition = 0

  const _whenScrolling = () => {
    if(!sv) return
    lastScrollPosition = isTop ? sv.scrollTop : sv.scrollLeft
    opt?.onScrolling?.(lastScrollPosition)
  }

  onActivated(() => {
    if(lastScrollPosition <= 1) return
    if(!sv) return
    if(isTop) {
      sv.scrollTop = lastScrollPosition
    }
    else {
      sv.scrollLeft = lastScrollPosition
    }
  })

  onMounted(() => {
    sv = document.querySelector(selectors)
    if(!sv) return
    sv.addEventListener("scroll", _whenScrolling)
  })

  onUnmounted(() => {
    if(!sv) return
    sv.removeEventListener("scroll", _whenScrolling)
  })
}