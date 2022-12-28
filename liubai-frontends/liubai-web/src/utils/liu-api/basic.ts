const requestAnimationFrame = (): Promise<boolean> => {
  let _handle = (a: (res: boolean) => void): void => {
    window.requestAnimationFrame(e => {
      a(true)
    })
  }

  return new Promise(_handle)
}

const eventTargetIsSomeTag = (
  eventTarget: EventTarget | null,
  tagName: string
) => {
  if(!eventTarget) return false
  const lowercase = tagName.toLowerCase()
  const uppercase = tagName.toUpperCase()
  const el = eventTarget as Element
  const t = el.tagName
  if(t === lowercase || t === uppercase) return true
  return false
}

export default {
  requestAnimationFrame,
  eventTargetIsSomeTag,
}