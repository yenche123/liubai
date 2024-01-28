// 监听 Enter 回车键
import type { SimpleFunc } from "~/utils/basic/type-tool"


/********* 监听 Enter 键的相关逻辑 *********/

let funWhileEnter: SimpleFunc | undefined
let funAfterEnter: SimpleFunc | undefined

const _onListenEnterUp = (
  e: KeyboardEvent,
) => {
  if(e.key !== "Enter") return
  funAfterEnter && funAfterEnter()
}

const _onListenEnterDown = (
  e: KeyboardEvent,
) => {
  if(e.key !== "Enter") return
  funWhileEnter && funWhileEnter()
}

const toListenEnterKey = (
  fooUp: SimpleFunc,
  fooDown?: SimpleFunc,
) => {
  window.addEventListener("keyup", _onListenEnterUp)
  funAfterEnter = fooUp
  if(fooDown) {
    window.addEventListener("keydown", _onListenEnterDown)
    funWhileEnter = fooDown
  }
}

const cancelListenEnterKeyUp = () => {
  window.removeEventListener("keyup", _onListenEnterUp)
  funAfterEnter = undefined
  if(funWhileEnter) {
    window.removeEventListener("keydown", _onListenEnterDown)
    funWhileEnter = undefined
  }
}

/********* 监听 Esc 键的相关逻辑 *********/

let funAfterEsc: SimpleFunc | undefined
const _onListenEsc = (e: KeyboardEvent) => {
  if(e.key === "Escape") {
    funAfterEsc && funAfterEsc()
  }
}

const toListenEscKeyUp = (foo: SimpleFunc): void => {
  window.addEventListener("keyup", _onListenEsc)
  funAfterEsc = foo
}

const cancelListenEscKeyUp = () => {
  window.removeEventListener("keyup", _onListenEsc)
  funAfterEsc = undefined
}

export {
  toListenEnterKey,
  cancelListenEnterKeyUp,
  toListenEscKeyUp,
  cancelListenEscKeyUp,
}