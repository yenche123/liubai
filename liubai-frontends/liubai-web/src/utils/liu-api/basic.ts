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

const encode_URI_component = (uri: string | boolean | number) => {
  let str = ""
  try {
    str = encodeURIComponent(uri)
  }
  catch(err) {
    console.warn("encodeURIComponent 出错......")
    console.log(err)
  }
  return str
}

const decode_URI_component = (val: string) => {
  let str = ""
  try {
    str = decodeURIComponent(val)
  }
  catch(err) {
    console.warn("decodeURIComponent 出错......")
    console.log(err)
  }
  return str
}

export default {
  requestAnimationFrame,
  eventTargetIsSomeTag,
  encode_URI_component,
  decode_URI_component,
}