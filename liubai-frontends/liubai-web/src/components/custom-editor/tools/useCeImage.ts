import { ref } from "vue"
import imgHelper from "../../../utils/images/img-helper"

export function useCeImage() {
  const selectImagesEl = ref<HTMLInputElement | null>(null)

  const onImageChange = async () => {
    const el = selectImagesEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    console.log("el.files: ")
    console.log(el.files)
    console.log("去压缩图片..............")
    const res = await imgHelper.compress(el.files)
    console.log("得到最新的图片.......")
    console.log(res)
    console.log(" ")
  }

  return { selectImagesEl, onImageChange }
}