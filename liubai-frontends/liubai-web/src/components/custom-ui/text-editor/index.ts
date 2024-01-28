
import { computed, reactive, ref } from "vue"
import valTool from "~/utils/basic/val-tool"
import { 
  toListenEnterKey, 
  cancelListenEnterKeyUp,
  toListenEscKeyUp,
  cancelListenEscKeyUp,
} from "../tools/listen-keyup"

interface TextEditorSuccessRes {
  confirm: boolean
  cancel: boolean
  value: string      // 注意，如果用户点击取消，该字段仍然会有值；该字段永远反应于用户输入的文字
}

interface TextEditorParam {
  title?: string
  title_key?: string
  placeholder?: string
  placeholder_key?: string   // t(placeholder_key)
  value?: string          // 用户已输入的文字
  minLength?: number
  maxLength?: number
  trim?: boolean         // 默认为 true
  success?: (res: TextEditorSuccessRes) => void
}

type TextEditorResolver = (res: TextEditorSuccessRes) => void

let _success: TextEditorResolver | undefined
let _resolve: TextEditorResolver | undefined

const enable = ref(false)
const show = ref(false)
const inputEl = ref<HTMLElement | null>(null)
const TRANSITION_DURATION = 120 // 200

const DEFAULT_MIN_LENGTH = 1
const DEFAULT_MAX_LENGTH = 20

const teData = reactive({
  title: "",
  title_key: "",
  placeholder: "",
  placeholder_key: "",
  value: "",
  minLength: DEFAULT_MIN_LENGTH,
  maxLength: DEFAULT_MAX_LENGTH,
  trim: true,
})

const canSubmit = computed(() => {
  let v = teData.value
  if(teData.trim) v = v.trim()
  if(v.length >= teData.minLength && v.length <= teData.maxLength) return true
  return false
})

const _openTextEditor = async (): Promise<void> => {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
  toListenEnterKey(whenEnterUp, whenEnterDown)
  toListenEscKeyUp(onTapCancel)
}

const _closeTextEditor = async (): Promise<void> => {
  if(!show.value) return
  show.value = false

  cancelListenEnterKeyUp()
  cancelListenEscKeyUp()

  await valTool.waitMilli(TRANSITION_DURATION)
  if(show.value) return
  enable.value = false
}


let oldValWhileEnterDown = ""
async function whenEnterDown() {
  oldValWhileEnterDown = teData.value
}

async function whenEnterUp() {
  const newV = teData.value

  // MacOS 注音輸入法時 在選字時按 Enter 鍵會觸發回調 故去判斷
  // Enter 鍵按下去和彈起來時文字是否一致 若一致才代表當前不在選字
  // 用戶是真的想「確認」
  if(newV !== oldValWhileEnterDown) return
  onTapConfirm()
}

const onTapConfirm = (): void => {
  if(!canSubmit.value) return
  const v = teData.trim ? teData.value.trim() : teData.value
  _resolve && _resolve({ confirm: true, cancel: false, value: v })
  _resolve = undefined
  _success && _success({ confirm: true, cancel: false, value: v })
  _success = undefined
  _closeTextEditor()
}

const onTapCancel = (): void => {
  const v = teData.trim ? teData.value.trim() : teData.value
  _resolve && _resolve({ confirm: false, cancel: true, value: v })
  _resolve = undefined
  _success && _success({ confirm: false, cancel: true, value: v })
  _success = undefined
  _closeTextEditor()
}

const initTextEditor = () => {
  return { 
    enable, 
    show, 
    teData, 
    onTapConfirm, 
    onTapCancel, 
    inputEl, 
    canSubmit,
    TRANSITION_DURATION,
  }
}

const showTextEditor = async (opt: TextEditorParam): Promise<TextEditorSuccessRes> => {
  teData.title = opt.title ?? ""
  teData.title_key = opt.title_key ?? ""
  teData.placeholder = opt.placeholder ?? ""
  teData.placeholder_key = opt.placeholder_key ?? ""
  teData.value = opt.value ?? ""

  if(typeof opt.minLength === "number") teData.minLength = opt.minLength
  else teData.minLength = DEFAULT_MIN_LENGTH
  if(typeof opt.maxLength === "number") teData.maxLength = opt.maxLength
  else teData.maxLength = DEFAULT_MAX_LENGTH

  if(typeof opt.trim === "boolean") teData.trim = opt.trim
  else teData.trim = true

  if(opt.success) {
    _success = opt.success
  }
  else {
    _success = undefined
  }

  await _openTextEditor()

  const _toFocus = async() => {
    await valTool.waitMilli(200)
    inputEl?.value?.focus()
  }
  _toFocus()
  
  const _wait = (a: TextEditorResolver): void => {
    _resolve = a
  }

  return new Promise(_wait)
}

export {
  initTextEditor,
  showTextEditor,
}