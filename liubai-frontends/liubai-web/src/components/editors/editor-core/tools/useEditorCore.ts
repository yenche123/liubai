import { useEditor } from '@tiptap/vue-3'
import { useI18n } from 'vue-i18n'
import type { TipTapEditor } from "~/types/types-editor"
import { inject, onMounted, ref, toRef, watch, computed } from 'vue'
import type { ShallowRef } from "vue"
import type { 
  EditorCoreProps, 
  EditorCoreEmits,
  EditorCorePurpose,
  EditorCoreStyles,
} from "./types"
import { initExtensions } from "./init-extensions"
import { useEcHashtag } from "./useEcHashtag"
import { editorSetKey } from '~/utils/provide-keys'
import type { LiuTimeout } from '~/utils/basic/type-tool'
import type { Ref } from "vue"
import valTool from '~/utils/basic/val-tool'
import { handlePaste } from './handle-paste'

interface EcContext {
  lastEmpty: boolean
  lastText: string
  lastTriggetUpdate: LiuTimeout
}

export function useEditorCore(
  props: EditorCoreProps, 
  emits: EditorCoreEmits
) {
  const { t } = useI18n()

  const contentRef = toRef(props, "content")
  const purpose = toRef(props, "purpose")
  const extensions = initExtensions(props, emits, t)
  const content = props?.content ?? "<p></p>"

  const ctx: EcContext = {
    lastEmpty: true,
    lastText: "",
    lastTriggetUpdate: undefined
  }

  const editor = useEditor({
    content,
    extensions,
    editorProps: {
      handlePaste,
    },
    editable: props.isEdit,
    onUpdate({ editor }) {
      onEditorUpdate(editor, props, emits, ctx)
    },
    onFocus({ editor }) {
      onEditorFocus(editor, emits)
    },
    onBlur({ editor }) {
      onEditorBlur(editor, emits)
    }
  })
  
  useEcHashtag(editor, props, emits)
  
  if(props.isEdit) {
    // 编辑模式时，去初始化 lastEmpty / lastText

    const numWhenSet = inject(editorSetKey, ref(0))
    watch(numWhenSet, (newV) => {
      if(newV > 0) setLastData(editor, ctx)
    })
    onMounted(() => {
      setLastData(editor, ctx)
    })
  }
  else {
    // 浏览模式时，外部可能修改 content

    watch(contentRef, (newV) => {
      if(!editor.value) return
      if(!newV) return
      editor.value.commands.setContent(newV)
    })
  }

  const styles = getStyles(purpose)
  const transition = ref("0")
  onMounted(async () => {
    await valTool.waitMilli(200)
    if(purpose.value === "thread-edit") transition.value = ".3s"
  })

  return {
    editor,
    styles,
    transition,
  }
}

function getStyles(
  purpose: Ref<EditorCorePurpose>
) {
  const styles = computed<EditorCoreStyles>(() => {
    let pse = purpose.value
    const isComment = pse === "comment-browse" || pse === "comment-edit"
    if(isComment) {
      return {
        fontSize: "var(--comment-font)",
        h1Size: "var(--desc-font)",
        inlineCodeSize: "var(--comment-inline-code)",
        selectBg: "var(--select-bg-2)",
        lineHeight: 1.7,
      }
    }

    return {
      fontSize: "var(--desc-font)",
      h1Size: "var(--title-font)",
      inlineCodeSize: "var(--inline-code-font)",
      selectBg: "var(--select-bg)",
      lineHeight: 1.9,
    }
  })

  return styles
}

function setLastData(
  editor: ShallowRef<TipTapEditor | undefined>,
  ctx: EcContext,
) {
  const eee = editor.value
  if(!eee) return
  ctx.lastEmpty = eee.isEmpty
  ctx.lastText = eee.getText()
}

function onEditorFocus(
  editor: TipTapEditor,
  emits: EditorCoreEmits
) {
  const html = editor.getHTML()
  const text = editor.getText()
  const json = editor.getJSON()
  const data = { html, text, json }
  emits("focus", data)
}

function onEditorBlur(
  editor: TipTapEditor,
  emits: EditorCoreEmits
) {
  const html = editor.getHTML()
  const text = editor.getText()
  const json = editor.getJSON()
  const data = { html, text, json }
  emits("blur", data)
}

function onEditorUpdate(
  editor: TipTapEditor,
  props: EditorCoreProps,
  emits: EditorCoreEmits,
  ctx: EcContext,
) {
  const html = editor.getHTML()
  const text = editor.getText()
  const json = editor.getJSON()
  const data = { html, text, json }
  const empty = editor.isEmpty
  if(ctx.lastTriggetUpdate) clearTimeout(ctx.lastTriggetUpdate)

  if(ctx.lastEmpty !== empty) {
    emits("update", data)
    ctx.lastEmpty = empty
    ctx.lastText = text
    return
  }
  if(!text && !ctx.lastText) {
    return
  }

  ctx.lastTriggetUpdate = setTimeout(() => {
    ctx.lastTriggetUpdate = undefined
    emits("update", data)
    ctx.lastEmpty = empty
    ctx.lastText = text
  }, 150)
}
