import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { ImageShow } from "~/types";
import type { ContentLocalTable } from "~/types/types-table";
import type { ScContentAtom } from "./types"
import time from "~/utils/basic/time";
import imgHelper from "~/utils/images/img-helper";
import transferUtil from "../../../utils/transfer-util"

export function getSpaceId() {
  const wStore = useWorkspaceStore()
  return wStore.spaceId
}

export function resToAtoms(
  prefix: string, 
  res: ContentLocalTable[],
  keyword?: string,
) {
  const now = time.getTime()
  let list = res.map((v, i) => {
    let atomId = `${prefix}_${now + i}`
    let { title, desc } = _getTitleAndDesc(v, keyword)

    // 处理图片
    let imgShow: ImageShow | undefined = undefined
    if(v.images?.length) {
      imgShow = imgHelper.imageStoreToShow(v.images[0])
    }

    // 处理 commentId threadId
    let commentId: string | undefined = undefined
    let threadId = v.underThread ?? ""
    if(threadId) {
      commentId = v._id
    }
    else {
      threadId = v._id
    }

    let obj: ScContentAtom = {
      atomId,
      title,
      desc,
      threadId,
      commentId,
      imgShow,
    }

    return obj
  })

  return list
}


function _getTitleAndDesc(v: ContentLocalTable, keyword?: string) {
  let title = v.title ?? ""
  let desc = ""

  let content = transferUtil.tiptapToText(v.liuDesc ?? [])
  // TODO: Highlight
  if(!title) {
    title = _getHighlight(content, keyword)
  }
  else {
    desc = _getHighlight(content, keyword)
  }

  return { title, desc }
}

function _getHighlight(text: string, keyword?: string) {
  let lowerText = text.toLowerCase()
  if(keyword) {
    let idx = lowerText.indexOf(keyword)

    // 只有 大于 10 要向前 trim
    if(idx >= 10) {
      text = _trimForward(text, idx)
    }
  }

  // 向后 trim
  if(text.length > 40) {
    text = _trimBackward(text, 0)
  }
  
  text = text.replace(/\n/g, " ")
  text = text.trim()

  return text
}

function _trimForward(text: string, end: number) {

  
  return text
}

function _trimBackward(text: string, start: number) {

  return text
}
