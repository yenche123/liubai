import { ref } from "vue"



export function useIndexPage() {

  const showTop = ref(true)

  const onNaviAutoChanged = (isNaviAutoOpened: boolean) => {
    showTop.value = !isNaviAutoOpened
  }

  return {
    showTop,
    onNaviAutoChanged,
  }
}