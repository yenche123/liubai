import { watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ensureCustomUi, requestedCustomUi, type CustomUiName } from "./lazy-custom-ui"

// These URLs only describe transient UI; their payload lives in controller memory.
const transientPopups: Record<string, CustomUiName> = {
  commentpopup: "comment-popup",
  contentpanel: "content-panel",
  hashtageditor: "hashtag-editor",
  htselector: "hashtag-selector",
  previewimage: "preview-image",
  shareview: "share-view",
  stateeditor: "state-editor",
  stateselector: "state-selector",
  browsecode: "browse-code",
  qrcodepopup: "qrcode-popup",
}

export function useCustomUiRoute() {
  const route = useRoute()
  const router = useRouter()
  watch(() => [route.query, route.meta.inApp] as const, ([query, inApp]) => {
    const clean = { ...query }
    let changed = false
    for (const [key, name] of Object.entries(transientPopups)) {
      if (key in clean && !requestedCustomUi[name]) {
        delete clean[key]
        changed = true
      }
    }
    if (changed) {
      // Replace once, preserving business parameters, the fragment and history.
      void router.replace({ path: route.path, query: clean, hash: route.hash })
      return
    }
    // Search is recoverable from the URL, including navigation after app startup.
    if (inApp !== false && (query.search === "01" || query.q)) {
      void ensureCustomUi("search-editor").catch(error => {
        console.warn("Failed to load search editor", error)
      })
    }
  }, { immediate: true })
}
