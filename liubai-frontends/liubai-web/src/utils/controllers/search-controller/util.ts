import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { ImageShow } from "~/types";
import type { ContentLocalTable } from "~/types/types-table";
import type { ScContentAtom } from "./types"
import time from "~/utils/basic/time";
import imgHelper from "~/utils/files/img-helper";
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
    let threadId = v.parentThread ?? ""
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


function _getTitleAndDesc(
  v: ContentLocalTable, 
  keyword?: string
) {
  let title = v.title ?? ""
  let desc = ""

  const content = transferUtil.tiptapToText(v.liuDesc ?? [])
  const fileName = _getFileName(v)

  if(!title) {
    let tmpTitle = _getOneLine(content)
    let tmpDesc = _getHighlight(content, fileName, keyword)
    
    if(tmpTitle) {
      title = tmpTitle
      if(tmpDesc !== tmpTitle) desc = tmpDesc
    }
    else if(tmpDesc) {
      title = tmpDesc
    }
    else if(fileName) {
      title = `[${fileName}]`
    }
  }
  else {
    desc = _getHighlight(content, fileName, keyword)
  }

  return { title, desc }
}

function _getFileName(v: ContentLocalTable) {
  let files = v.files
  if(!files?.length) return ""
  const firFile = files[0]
  return firFile.name
}


// 获取文本的第一行
function _getOneLine(text: string) {
  const lines = text.split("\n").filter(v => Boolean(v.trim()))
  return lines[0]
}

// 获取关键词所在的那一段
function _getHighlight(
  text: string, 
  fileName: string,
  keyword?: string,
) {
  const lowerText = text.toLowerCase()
  if(keyword) {
    let idx1 = lowerText.indexOf(keyword)
    if(idx1 < 0) {
      idx1 = lowerText.indexOf(keyword.toLowerCase())
    }
    const idx2 = fileName.toLowerCase().indexOf(keyword)

    if(idx1 < 0 && idx2 >= 0) {
      return `[${fileName}]`
    }

    // 只有 大于 10 要向前 trim
    if(idx1 >= 10) {
      text = _trimForward(text, idx1)
    }
  }

  // 向后 trim
  text = _trimBackward(text, keyword)
  
  text = text.replace(/\n/g, " ")
  text = text.trim()

  return text
}



const POINTS = ["\n", ",", ".", "，", "。", ";", "；", "!", "?", "！", "？"]

function _trimForward(text: string, end: number) {
  let num = 0
  for(let i = end-1; i >= 0; i--) {
    const char = text[i]

    num += valTool.getTextCharNum(char)

    if(num < 8) continue
    const isPoint = POINTS.includes(char)
    if(!isPoint) {
      if(num > 16) {
        text = text.substring(i)
        if(i > 0) {
          text = "..." + text
        }
        break
      }
      continue
    }

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
