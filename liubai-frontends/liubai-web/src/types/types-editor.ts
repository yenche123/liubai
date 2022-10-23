import { Editor, JSONContent } from "@tiptap/core"

export type TipTapEditor = Editor
export type TipTapJSONContent = JSONContent
export interface EditorCoreContent {
  text: string
  html: string
  json: TipTapJSONContent
}