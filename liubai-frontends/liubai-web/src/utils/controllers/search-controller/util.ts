import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { ImageShow } from "~/types";
import type { ContentLocalTable } from "~/types/types-table";
import type { ScContentAtom } from "./types"
import time from "~/utils/basic/time";
import imgHelper from "~/utils/images/img-helper";
import transferUtil from "../../../utils/transfer-util"
import valTool from "~/utils/basic/val-tool";

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
  if(!title) {
    let tmpTitle = _getOneLine(content)
    let tmpDesc = _getHighlight(content, keyword)
    if(tmpTitle) {
      title = tmpTitle
      if(tmpDesc !== tmpTitle) desc = tmpDesc
    }
    else {
      title = tmpDesc
    }
  }
  else {
    desc = _getHighlight(content, keyword)
  }

  return { title, desc }
}

// 获取文本的第一行
function _getOneLine(text: string) {
  const lines = text.split("\n").filter(v => Boolean(v.trim()))
  return lines[0]
}

// 获取关键词所在的那一段
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
  text = _trimBackward(text, keyword)
  
  text = text.replace(/\n/g, " ")
  text = text.trim()

  return text
}



const POINTS = ["\n", ",", ".", "，", "。", ";", "；"]

function _trimForward(text: string, end: number) {
  let num = 0
  for(let i = end-1; i >= 0; i--) {
    const char = text[i]

    num += valTool.getTextCharNum(char)

    if(num < 10) continue
    if(!POINTS.includes(char)) continue

    text = text.substring(i + 1)
    text = text.trimStart()

    if(i > 0) {
      text = "..." + text
    }

    break
  }

  
  return text
}

function _trimBackward(text: string, keyword?: string) {
  if(text.length < 20) {
    return text
  }

  let start = 16
  if(keyword) {
    let idx = text.toLowerCase().indexOf(keyword)
    if(idx >= 0) {
      start = idx + keyword.length
    }
  }

  let num = 0
  for(let i=start; i<text.length; i++) {
    const char = text[i]

    num += valTool.getTextCharNum(char)

    if(num < 90) continue
    if(!POINTS.includes(char)) continue

    let isEndPoint = i >= (text.length - 1)
    text = text.substring(0, i)
    text = text.trimEnd()

    if(!isEndPoint) {
      text = text + "......"
    }

    break
  }


  return text
}
