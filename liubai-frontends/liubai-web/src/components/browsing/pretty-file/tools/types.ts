import { LiuFileStore } from "~/types";


export type PrettyFileIcon = "word" | "excel" | "ppt" | "pdf" 
  | "text" | "photo" | "video" | "psd" | "attachment" | ""

export interface PrettyFileProps {
  file?: LiuFileStore
}