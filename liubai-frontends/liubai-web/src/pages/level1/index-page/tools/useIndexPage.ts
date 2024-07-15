import { ref } from "vue"

export function useIndexPage() {
  const isNaviAutoShown = ref(false)

  const onNaviAutoChanged = (isNaviAutoOpened: boolean) => {
    isNaviAutoShown.value = isNaviAutoOpened
  }

  return {
    isNaviAutoShown,
    onNaviAutoChanged,
  }
}