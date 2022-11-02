import { ref } from "vue"
import type { ImageShow } from "../../../types"
import imgHelper from "../../../utils/images/img-helper"
import liuUtil from "../../../utils/liu-util"

export function useCeImage() {
  const selectImagesEl = ref<HTMLInputElement | null>(null)
  const covers = ref<ImageShow[]>([])

  const onImageChange = async () => {
    const el = selectImagesEl.value
    if(!el) return
    if(!el.files || !el.files.length) return

    const res = await imgHelper.compress(el.files)
    const res2 = await imgHelper.getMetaDataFromFiles(res)
    const res3 = liuUtil.createObjURLs(res)
    res3.forEach((v, i) => {
      const v2 = res2[i]
      const obj: ImageShow = {
        src: v,
        id: "local_" + v2.local_id,
        width: v2.width,
        height: v2.height,
        h2w: v2.h2w,
      }
      covers.value.push(obj)
    })
  }

  const onClearCover = (index: number) => {
    const list = covers.value
    const item = list[index]
    if(!item) return
    list.splice(index, 1)
  }

  return { 
    selectImagesEl, 
    onImageChange, 
    covers, 
    onClearCover 
  }
}