import { useWindowSize } from '~/hooks/useVueUse';
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import type { RouteAndLiuRouter } from "~/routes/liu-router";
import type { LiuFileStore } from '~/types';
import liuUtil from '~/utils/liu-util';
import type { TcaProps } from './types';
import cfg from '~/config';

export function useTcAttachments(props: TcaProps) {
  const rr = useRouteAndLiuRouter()

  const onTapFile = (e: MouseEvent, index: number) => {
    if(!props.thread?.files?.length) return
    const v = props.thread.files[index]
    checkHowToDownload(v, rr)
  }

  return {
    onTapFile
  }
}


function checkHowToDownload(
  f: LiuFileStore,
  rr: RouteAndLiuRouter,
) {
  const _suffix = f.suffix.toLowerCase()
  const { width } = useWindowSize()

  // pdf 文件，用浏览器打开或 iframe 查看
  if(_suffix === "pdf") {

    if(width.value < cfg.vice_detail_breakpoint) {
      _downloadByWindow(f)
    }
    else {
      _openByIframe(f, rr)
    }
  }
  else {
    _downloadByA(f)
  }
}

function _openByIframe(
  f: LiuFileStore,
  rr: RouteAndLiuRouter,
) {
  let [url] = liuUtil.createURLsFromStore([f])
  if(!url) return
  rr.router.pushCurrentWithNewQuery(rr.route, { pdf: url })
}


/** 使用 a 标签来下载 */
function _downloadByA(f: LiuFileStore) {
  let [url] = liuUtil.createURLsFromStore([f])
  if(!url) return

  const a = document.createElement("a")
  a.href = url
  a.download = f.name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * 使用 window.open 来下载
 *   开启新分页下载文件时，请不要使用 revokeObjURLs 回收文件
 *   因为这样用户在新的分页时，会无法另存成新的文件
 */
function _downloadByWindow(f: LiuFileStore) {
  let [url] = liuUtil.createURLsFromStore([f])
  if(!url) return
  window.open(url, f.name)
}