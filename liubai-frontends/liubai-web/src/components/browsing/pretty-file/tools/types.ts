import type { LiuFileStore } from "~/types";
import type { PropType } from 'vue';

export type PrettyFileIcon = "word" | "excel" | "ppt" | "pdf" 
  | "text" | "photo" | "video" | "psd" | "attachment" | ""

export interface PrettyFileProps {
  file?: LiuFileStore
}

export const prettyFileProps = {
  file: {
    type: Object as PropType<LiuFileStore>
  }
}

export interface PrettyFileEmit {
  (evt: "aftertapfile"): void
}