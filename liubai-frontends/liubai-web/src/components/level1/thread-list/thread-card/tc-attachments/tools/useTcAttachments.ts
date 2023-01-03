import type { FileLocal } from '../../../../../../types';
import liuUtil from '../../../../../../utils/liu-util';
import type { TcaProps } from './types';

export function useTcAttachments(props: TcaProps) {

  const onTapFile = (e: MouseEvent, index: number) => {
    e.stopPropagation()
    if(!props.thread?.files?.length) return
    const v = props.thread.files[index]
    checkHowToDownload(v)
  }

  return {
    onTapFile
  }
}


function checkHowToDownload(f: FileLocal) {
  const _suffix = f.suffix.toLowerCase()

  // pdf 文件，直接用浏览器打开查看
  if(_suffix === "pdf") {
    _downloadByWindow(f)
  }
  else {
    _downloadByA(f)
  }
}

/** 使用 a 标签来下载 */
function _downloadByA(f: FileLocal) {
  let url = ""
  let useCreateObj = false
  if(f.file) {
    [url] = liuUtil.createObjURLs([f.file])
    useCreateObj = true
  }
  else if(f.cloud_url) {
    url = f.cloud_url
  }
  if(!url) return

  const a = document.createElement("a")
  a.href = url
  a.download = f.name
  document.body.appendChild(a)
  a.click()
  a.remove()

  if(useCreateObj) {
    liuUtil.revokeObjURLs([url])
  }
}

/**
 * 使用 window.open 来下载
 *   开启新分页下载文件时，请不要使用 revokeObjURLs 回收文件
 *   因为这样用户在新的分页时，会无法另存成新的文件
 */
function _downloadByWindow(f: FileLocal) {
  let url = ""
  if(f.file) {
    [url] = liuUtil.createObjURLs([f.file])
  }
  else if(f.cloud_url) {
    url = f.cloud_url
  }

  if(!url) return
  window.open(url, f.name)
}