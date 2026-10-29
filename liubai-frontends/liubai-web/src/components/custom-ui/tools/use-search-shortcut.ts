import { useRoute } from "vue-router"
import { useKeyboard } from "~/hooks/useKeyboard"
import {
  POPUP_KEYS,
  SEARCH_QUERY_KEY,
  SEARCH_TEXT_QUERY_KEY,
  isSearchQueryOpen,
} from "~/config/atom"
import cui from ".."

// Only the first invocation needs this listener; the editor owns its keys after mount.
export function useSearchShortcut() {
  const route = useRoute()
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
  let opening = false
  useKeyboard({
    whenKeyDown(event) {
      if (opening || isSearchQueryOpen(route.query) || route.meta.inApp === false) return
      if (!(isMac ? event.metaKey : event.ctrlKey) || event.shiftKey || event.altKey) return
      if (!["k", "p"].includes(event.key.toLowerCase())) return
      if (POPUP_KEYS.some(key => key !== SEARCH_QUERY_KEY && key !== SEARCH_TEXT_QUERY_KEY && typeof route.query[key] === "string")) return
      event.preventDefault()
      opening = true
      void cui.showSearchEditor({ type: "search" }).catch(error => {
        console.warn("Failed to open search editor", error)
      }).finally(() => { opening = false })
    },
  })
}
