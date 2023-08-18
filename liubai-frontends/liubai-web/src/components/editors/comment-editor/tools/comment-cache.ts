import liuUtil from "~/utils/liu-util"
import type { CommentStorageAtom, CommentStorageType } from "./types"
import valTool from "~/utils/basic/val-tool"

let list: CommentStorageAtom[] = []

function toSave(
  atom: CommentStorageAtom,
  saveType: CommentStorageType = "content",
) {
  
  let _atom = liuUtil.toRawData(atom)
  let hasFound = false

  const _setSpecificData = (v: CommentStorageAtom) => {
    hasFound = true
    if(saveType === "content") {
      v.editorContent = _atom.editorContent
    }
    else if(saveType === "file") {
      v.files = _atom.files
    }
    else if(saveType === "image") {
      v.images = _atom.images
    }
  }


  list.forEach(v => {
    if(_atom.commentId) {
      if(_atom.commentId === v.commentId) {
        _setSpecificData(v)
      }
      return
    }
    
    
    if(!v.commentId && v.parentThread === _atom.parentThread) {
      if(v.parentComment === _atom.parentComment) {
        if(v.replyToComment === _atom.replyToComment) {
          _setSpecificData(v)
        }
      }
    }
  })

  if(!hasFound) {
    list.push(_atom)
  }
}

function toGet(atom: CommentStorageAtom) {
  let res: CommentStorageAtom | undefined
  list.forEach(v => {
    if(atom.commentId) {
      if(atom.commentId === v.commentId) {
        res = valTool.copyObject(v)
      }
      return
    }

    if(!v.commentId && v.parentThread === atom.parentThread) {
      if(v.parentComment === atom.parentComment) {
        if(v.replyToComment === atom.replyToComment) {
          res = valTool.copyObject(v)
        }
      }
    }
  })
  return res
}

function toDelete(atom: CommentStorageAtom) {
  for(let i=0; i<list.length; i++) {
    const v = list[i]

    // 当前为 "编辑评论时"
    if(atom.commentId) {
      if(atom.commentId === v.commentId) {
        list.splice(i, 1)
      }
      continue 
    }

    // !v.commentId 是为了过滤掉属于 "编辑的评论"
    if(!v.commentId && v.parentThread === atom.parentThread) {
      if(v.parentComment === atom.parentComment) {
        if(v.replyToComment === atom.replyToComment) {
          list.splice(i, 1)
        }
      }
    }
  }
}

export default {
  toSave,
  toGet,
  toDelete,
}