// 专门生成 id 用的

import { customAlphabet } from 'nanoid'

function _createId(digits: number = 21) {
  const ABC = "123456789abcdefghijkmnopqrstuvwxyz"
  const nanoid = customAlphabet(ABC, digits)
  return nanoid()
}

const createUserId = () => {
  return "u0" + _createId(14)
}

/** 生成 LiuAtomState 的 id */
const createStateId = () => {
  return "s0" + _createId(16)
}

const createWorkspaceId = () => {
  return "w0" + _createId(16)
}

const createMemberId = () => {
  return "m0" + _createId(18)
}

// don't modify `d0` just because whenDraftClear function 
// in add-upload-task.ts is using it
const createDraftId = () => {
  return "d0" + _createId(18)
}

// don't modify `t0` just because _getNewProps function in
// finish-comment.ts is using it
const createThreadId = () => {
  return "t0" + _createId(20)
}

// don't modify `c0` just because _getNewProps function in
// finish-comment.ts is using it
const createCommentId = () => {
  return "c0" + _createId(20)
}

const createImgId = () => {
  return "i0" + _createId(18)
}

const createFileId = () => {
  return "f0" + _createId(18)
}

const createTagId = () => {
  return "t1" + _createId(18)
}

const createCollectId = () => {
  return "c1" + _createId(20)
}

const createRandom = (digits: number = 7) => {
  return _createId(digits)
}

const createDownloadTaskId = () => {
  return "d1" + _createId(20)
}

const createUploadTaskId = () => {
  return "u1" + _createId(20)
}

const createSyncGetTaskId = () => {
  return "sg0" + _createId(20)
}

const createEncNonce = () => {
  return _createId(10)
}

const createFileNonce = () => {
  return _createId(4)
}

const createOpenId = () => {
  return "op0" + _createId(16)
}

export default {
  createUserId,
  createStateId,
  createWorkspaceId,
  createMemberId,
  createDraftId,
  createThreadId,
  createCommentId,
  createImgId,
  createFileId,
  createTagId,
  createCollectId,
  createRandom,
  createDownloadTaskId,
  createUploadTaskId,
  createSyncGetTaskId,
  createEncNonce,
  createFileNonce,
  createOpenId,
}