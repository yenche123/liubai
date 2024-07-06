import { useRouteAndLiuRouter } from '~/routes/liu-router';
import type { TcaProps } from './types';
import { checkFile } from '~/utils/files/checkFile';
import { CloudFiler } from '~/utils/cloud/CloudFiler';

export function useTcAttachments(props: TcaProps) {
  const rr = useRouteAndLiuRouter()

  const onTapFile = (e: MouseEvent, index: number) => {
    const { thread } = props
    const files = thread?.files
    if(!files || files.length < 1) return
    const v = files[index]

    // 1. view the file
    checkFile(v, rr)

    // 2. check whether to download
    const contentId = thread._id
    const { arrayBuffer, id: file_id } = v
    if(arrayBuffer) return
    CloudFiler.notify("contents", contentId, file_id)
  }

  return {
    onTapFile
  }
}
