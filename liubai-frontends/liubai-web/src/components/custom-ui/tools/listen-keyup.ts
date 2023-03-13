// 监听 Enter 回车键
import type { SimpleFunc } from "~/utils/basic/type-tool"


/********* 监听 Enter 键的相关逻辑 *********/

let funAfterEnter: SimpleFunc | undefined

const _onListenEnter = (e: KeyboardEvent) => {
  if(e.key === "Enter") {
    funAfterEnter && funAfterEnter()
  }
}

const toListenEnterKeyUp = (foo: SimpleFunc): void => {
  window.addEventListener("keyup", _onListenEnter)
  funAfterEnter = foo
}

const cancelListenEnterKeyUp = () => {
  window.removeEventListener("keyup", _onListenEnter)
  funAfterEnter = undefined
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
  toListenEnterKeyUp,
  cancelListenEnterKeyUp,
  toListenEscKeyUp,
  cancelListenEscKeyUp,
}