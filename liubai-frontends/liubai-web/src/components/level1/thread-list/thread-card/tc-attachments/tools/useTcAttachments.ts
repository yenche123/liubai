import { useRouteAndLiuRouter } from '~/routes/liu-router';
import type { TcaProps } from './types';
import { checkFile } from '~/utils/files/checkFile';

export function useTcAttachments(props: TcaProps) {
  const rr = useRouteAndLiuRouter()

  const onTapFile = (e: MouseEvent, index: number) => {
    const files = props.thread?.files
    if(!files || files.length < 1) return
    const v = files[index]
    checkFile(v, rr)
  }

  return {
    onTapFile
  }
}
