import { ref } from "vue"



export function useCeImage() {
  const selectImagesEl = ref<HTMLInputElement | null>(null)

  const onImageChange = () => {
    const el = selectImagesEl.value
    if(!el) return
    console.log("el.files: ")
    console.log(el.files)
  }

  return { selectImagesEl, onImageChange }
}