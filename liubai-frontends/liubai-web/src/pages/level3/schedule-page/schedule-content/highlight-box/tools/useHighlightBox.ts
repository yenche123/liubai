import { ref } from "vue"

let everClosed = false
export function useHighlightBox() {
  const show = ref(!everClosed)

  const onTapClose = () => {
    show.value = false
    everClosed = true
  }

  return {
    show,
    onTapClose,
  }
}