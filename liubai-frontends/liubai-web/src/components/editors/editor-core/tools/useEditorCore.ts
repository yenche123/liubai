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
import type { LinkPreview } from '~/types/types-atom'

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
      handlePaste: (view, evt) => {
        // 返回 false: 使用默认行为
        // 返回 true: 将阻止默认行为

        const clipboardData = evt.clipboardData
        if(!clipboardData) {
          return false
        }

        const idx = clipboardData.types.indexOf("text/link-preview")
        if(idx < 0) {
          return false
        }

        const jsonTxt = clipboardData.getData("text/link-preview")

        let linkJson: LinkPreview
        try {
          linkJson = JSON.parse(jsonTxt)
        }
        catch(err) {
          return false
        }

        const title = linkJson.title
        const url = linkJson.url
        if(!title || !url) return false
        const linkText = `[${title}](${url})`

        const startPoi = view.state.selection.from
        const endPoi = view.state.selection.to
        const transaction = view.state.tr.insertText(linkText, startPoi, endPoi)
        view.dispatch(transaction)
      
        return true
      }
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
        inlineCodeSize: "var(--comment-inline-code)",
        selectBg: "var(--select-bg-2)",
        lineHeight: 1.7,
      }
    }

    return {
      fontSize: "var(--desc-font)",
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
