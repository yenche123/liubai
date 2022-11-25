// 专门生成 id 用的

import { customAlphabet } from 'nanoid'

function _createId(digits: number = 21) {
  const ABC = "123456789abcdefghijkmnopqrstuvwxyz"
  const nanoid = customAlphabet(ABC, digits)
  return nanoid()
}

const createUserId = () => {
  return "u0" + _createId(19)
}

const createWorkspaceId = () => {
  return "w0" + _createId(21)
}

const createMemberId = () => {
  return "m0" + _createId(23)
}

const createDraftId = () => {
  return "d0" + _createId(25)
}

const createThreadId = () => {
  return "t0" + _createId(25)
}

const createCommentId = () => {
  return "c0" + _createId(25)
}

const createImgId = () => {
  return "img_" + _createId(23)
}

const createFileId = () => {
  return "file_" + _createId(23)
}

const createTagId = () => {
  return "tag_" + _createId(23)
}

export default {
  createUserId,
  createWorkspaceId,
  createMemberId,
  createDraftId,
  createThreadId,
  createCommentId,
  createImgId,
  createFileId,
  createTagId,
}