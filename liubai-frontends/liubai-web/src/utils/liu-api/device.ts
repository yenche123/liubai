

type ResolveReject = (res: boolean | undefined) => void

const copyToClipboard = (text: string) => {

  // 方法2: 使用 navigator.clipboard
  let _fun2 = async (a: ResolveReject, b: ResolveReject, text: string) => {
    let res = false
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      res = true
    }

    a(res)
  }

  // 方法1: 创建 textarea 复制
  let _fun1 = (a: ResolveReject, b: ResolveReject, text: string) => {
    const element = document.createElement('textarea')
    document.body.appendChild(element)
    element.value = text
    element.select()
    if (document.execCommand('copy')) {
      document.execCommand('copy')
      document.body.removeChild(element)
      a(true)
      return
    }
    document.body.removeChild(element)
    _fun2(a, b, text)
  }

  // 判断使用哪个方法
  let _t = (a: ResolveReject, b: ResolveReject) => {
    if (!text) {
      console.warn(`没有内容要剪贴.....`)
      a(false)
      return
    }

    if (text.length > 500) {
      _fun2(a, b, text)
    }
    else {
      _fun1(a, b, text)
    }
  }

  return new Promise(_t)
}

export default {
  copyToClipboard,
}