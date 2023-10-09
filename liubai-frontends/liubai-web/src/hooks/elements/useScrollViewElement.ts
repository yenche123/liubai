import { onActivated, onMounted, onUnmounted } from "vue"

export type SveOnScrolling = (sT: number) => void

export function useScrollViewElement(
  selectors: string,
  onScrolling?: SveOnScrolling,
) {
  let sv: HTMLElement | null = null
  let lastScrollTop = 0

  const _whenScrolling = () => {
    if(!sv) return
    lastScrollTop = sv.scrollTop
    onScrolling?.(lastScrollTop)
  }

  onActivated(() => {
    if(lastScrollTop <= 1) return
    if(!sv) return
    sv.scrollTop = lastScrollTop
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