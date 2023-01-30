import { ref } from "vue";

export function useVvUI() {
  const isDraging = ref(false)

  const onPointerUp = (e: PointerEvent) => {
    console.log("not dragging...........")
    isDraging.value = false
    window.removeEventListener("pointerup", onPointerUp)
  }
  const onStartDrag = async (e: PointerEvent) => {
    console.log("isDragging..........")
    isDraging.value = true
    window.addEventListener("pointerup", onPointerUp)
  }
  return { isDraging, onStartDrag }
}