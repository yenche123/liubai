import liuUtil from "~/utils/liu-util"
import type { CommentStorageAtom, CommentStorageType } from "./types"
import localReq from "./req/local-req"

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
        res = liuUtil.copy.newData(v)
      }
      return
    }

    if(!v.commentId && v.parentThread === atom.parentThread) {
      if(v.parentComment === atom.parentComment) {
        if(v.replyToComment === atom.replyToComment) {
          res = liuUtil.copy.newData(v)
        }
      }
    }
  })
  return res
}

async function toGetByFirstId(
  atom: CommentStorageAtom,
) {
  const {
    parentThread,
    parentComment,
    replyToComment,
  } = atom

  // 1. init first_id
  let firstParentThread = parentThread
  let firstParentComment = parentComment
  let firstReplyToComment = replyToComment

  // 2. get first_id
  let hasChanged = false
  if(!parentThread.startsWith("t0")) {
    const res1 = await localReq.getContent(parentThread, false)
    if(res1 && res1.first_id !== firstParentThread) {
      firstParentThread = res1.first_id
      hasChanged = true
    }
  }
  if(parentComment && !parentComment.startsWith("c0")) {
    const res2 = await localReq.getContent(parentComment, false)
    if(res2 && res2.first_id !== firstParentComment) {
      firstParentComment = res2.first_id
      hasChanged = true
    }
  }
  if(replyToComment && !replyToComment.startsWith("c0")) {
    const res3 = await localReq.getContent(replyToComment, false)
    if(res3 && res3.first_id !== firstReplyToComment) {
      firstReplyToComment = res3.first_id
      hasChanged = true
    }
  }

  // 4. return if ids do not change
  if(!hasChanged) return


  // 5. find again
  let res5: CommentStorageAtom | undefined
  let targetIndex = -1
  list.forEach((v, i) => {
    if(!v.commentId && v.parentThread === firstParentThread) {
      if(v.parentComment === firstParentComment) {
        if(v.replyToComment === firstReplyToComment) {
          res5 = liuUtil.copy.newData(v)
          res5.parentThread = parentThread
          res5.parentComment = parentComment
          res5.replyToComment = replyToComment
          targetIndex = i
        }
      }
    }
  })

  // 6. update list
  if(targetIndex >= 0 && res5) {
    list.splice(targetIndex, 1, res5)
  }

  return res5
}

function toDelete(atom: CommentStorageAtom) {
  for(let i=0; i<list.length; i++) {
    const v = list[i]

    // 当前为 "编辑评论时"
    if(atom.commentId) {
      if(atom.commentId === v.commentId) {
        list.splice(i, 1)
        i--
      }
      continue 
    }

    // !v.commentId 是为了过滤掉属于 "编辑的评论"
    if(!v.commentId && v.parentThread === atom.parentThread) {
      if(v.parentComment === atom.parentComment) {
        if(v.replyToComment === atom.replyToComment) {
          list.splice(i, 1)
          i--
        }
      }
    }
  }
}

export default {
  toSave,
  toGet,
  toGetByFirstId,
  toDelete,
}