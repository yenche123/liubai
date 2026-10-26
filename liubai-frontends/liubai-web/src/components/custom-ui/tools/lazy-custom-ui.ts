import { defineAsyncComponent, defineComponent, h, onMounted, onUnmounted, reactive, type Component } from "vue"

export type CustomUiName =
  | "modal" | "text-editor" | "date-picker" | "preview-image"
  | "hashtag-editor" | "action-sheet" | "state-selector" | "state-editor"
  | "share-view" | "content-panel" | "comment-popup" | "hashtag-selector"
  | "qrcode-popup" | "bind-popup" | "browse-code" | "search-editor"

export const requestedCustomUi = reactive<Partial<Record<CustomUiName, boolean>>>({})

const mounted = new Set<CustomUiName>()
const pending = new Map<CustomUiName, {
  promise: Promise<void>
  resolve: () => void
  reject: (error: unknown) => void
}>()

// Controllers must wait for setup and route watchers before opening their popup.
export function ensureCustomUi(name: CustomUiName): Promise<void> {
  if (mounted.has(name)) return Promise.resolve()
  const existing = pending.get(name)
  if (existing) return existing.promise

  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  pending.set(name, { promise, resolve, reject })
  requestedCustomUi[name] = true
  return promise
}

export function defineLazyCustomUi(
  name: CustomUiName,
  loader: () => Promise<{ default: Component }>,
) {
  return defineAsyncComponent(async () => {
    try {
      const { default: component } = await loader()
      return defineComponent({
        setup() {
          onMounted(() => {
            mounted.add(name)
            pending.get(name)?.resolve()
            pending.delete(name)
          })
          onUnmounted(() => mounted.delete(name))
          return () => h(component)
        },
      })
    }
    catch (error) {
      requestedCustomUi[name] = false
      pending.get(name)?.reject(error)
      pending.delete(name)
      throw error
    }
  })
}
