import { inject, watch, ref } from "vue"
import { vcFileKey, mvFileKey } from "~/utils/provide-keys"
import type { CeCtx, CeProps } from "./types"
import liuUtil from "~/utils/liu-util"
import type { ImageShow, LiuFileStore, LiuImageStore } from "~/types"

export function useCommentFile(
  props: CeProps,
  ctx: CeCtx,
) {
  
  const covers = ref<ImageShow[]>([])

  // 监听从 vice-content 里掉落的文件
  let located = props.located
  if(located === "main-view") {
    listenFilesFromMainView()
  }
  else if(located === "vice-view") {
    listenFilesFromViceContent()
  }
  else if(located === "popup") {
    listenFilesFromPopup()
  }


  return { 
    covers,
    ctx,
  }
}

function listenFilesFromMainView() {
  const dropFiles = inject(mvFileKey)
  watch(() => dropFiles?.value, (newV) => {
    if(!newV?.length) return
    console.log("收到 main-view 掉落的文件.......")
    console.log(liuUtil.toRawData(newV))
    console.log(" ")
  })
}

function listenFilesFromViceContent() {
  const dropFiles = inject(vcFileKey)
  watch(() => dropFiles?.value, (newV) => {
    if(!newV?.length) return
    console.log("收到 vice-content 掉落的文件.......")
    console.log(liuUtil.toRawData(newV))
    console.log(" ")
  })
}

function listenFilesFromPopup() {

}