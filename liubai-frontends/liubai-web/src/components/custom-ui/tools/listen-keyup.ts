// 监听 Enter 回车键

type SimpleFunc = () => void
let funAfterEnter: SimpleFunc | undefined

const _onListenKepUp = (e: KeyboardEvent) => {
  if(e.key === "Enter") {
    funAfterEnter && funAfterEnter()
  }
}

const toListenEnterKeyUp = (foo: SimpleFunc): void => {
  window.addEventListener("keyup", _onListenKepUp)
  funAfterEnter = foo
}

const cancelListenEnterKeyUp = (): void => {
  window.removeEventListener("keyup", _onListenKepUp)
  funAfterEnter = undefined
}

export {
  toListenEnterKeyUp,
  cancelListenEnterKeyUp,
}