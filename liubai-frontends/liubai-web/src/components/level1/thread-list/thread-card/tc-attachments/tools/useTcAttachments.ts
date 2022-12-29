import { PropType } from 'vue';
import type { FileLocal } from '../../../../../../types';
import liuUtil from '../../../../../../utils/liu-util';

interface TcaProps {
  whenStr?: string
  remindStr?: string
  files?: FileLocal[]
}

export const tcaProps = {
  whenStr: String,
  remindStr: String,
  files: Array as PropType<FileLocal[]>
}

export function useTcAttachments(props: TcaProps) {

  const onTapFile = (e: MouseEvent, index: number) => {
    e.stopPropagation()
    if(!props.files?.length) return
    const v = props.files[index]

    let url = ""
    if(v.file) {
      const tmpList = liuUtil.createObjURLs([v.file])
      url = tmpList[0]
    }
    else if(v.cloud_url) {
      url = v.cloud_url
    }
    
    if(!url) return
    window.open(url, "_blank")
  }


  return {
    onTapFile
  }
}