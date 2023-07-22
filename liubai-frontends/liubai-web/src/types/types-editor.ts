import type { Editor, JSONContent, EditorOptions } from "@tiptap/core"

export type TipTapEditor = Editor
export type TipTapJSONContent = JSONContent
export interface EditorCoreContent {
  text: string
  html?: string
  json: TipTapJSONContent
}

export type TipTapEditorProps = EditorOptions['editorProps']

export type TipTapEditorPropsHandlePaste = NonNullable<TipTapEditorProps['handlePaste']>

export type TipTapEditorView = Parameters<TipTapEditorPropsHandlePaste>[0]