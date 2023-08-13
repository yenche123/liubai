
import { Plugin } from "@tiptap/pm/state"
import liuUtil from "~/utils/liu-util"

export const linkToTextPlugin = new Plugin({
  props: {
    transformPastedHTML(html) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      const aTags = doc.querySelectorAll('a[href]:not([href *= "javascript:" i])')
      aTags.forEach(v => {
        const href = v.getAttribute("href")
        const text = v.textContent
        if(!href || href === text) return

        const href2 = liuUtil.trim.removeTrack(href)

        let mdLink = `<span>[${text}](${href2})</span>`
        if(href2 === text) {
          mdLink = `<span>${text}</span>`
        }
        
        v.outerHTML = mdLink
      })

      const newHTML = doc.documentElement.innerHTML
      return newHTML
    }
  },
})