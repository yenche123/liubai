
import { Plugin } from "@tiptap/pm/state"

export const linkToTextPlugin = new Plugin({
  props: {
    transformPastedHTML(html) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      const aTags = doc.querySelectorAll('a[href]:not([href *= "javascript:" i])')
      aTags.forEach(v => {
        const href = v.getAttribute("href")
        const text = v.textContent
        if(href === text) return
        const mdLink = `<span>[${text}](${href})</span>`
        v.outerHTML = mdLink
      })

      const newHTML = doc.documentElement.innerHTML
      return newHTML
    }
  },
})