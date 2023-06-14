import { LiuFileStore } from "~/types";


export type PrettyFileIcon = "word" | "excel" | "ppt" | "pdf" 
  | "text" | "photo" | "video" | "attachment" | ""

export interface PrettyFileProps {
  file?: LiuFileStore
}