const requestAnimationFrame = (): Promise<boolean> => {
  let _handle = (a: (res: boolean) => void): void => {
    window.requestAnimationFrame(e => {
      a(true)
    })
  }

  return new Promise(_handle)
}

export default {
  requestAnimationFrame,
}