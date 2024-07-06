import { 
  cleanupOutdatedCaches, 
  createHandlerBoundToURL, 
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

console.log("[my service worker] Hello world!!!")

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING')
    self.skipWaiting()
})

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST)

// clean old assets
cleanupOutdatedCaches()

// to allow work offline
let allowlist: undefined | RegExp[]
if (import.meta.env.DEV) {
  allowlist = [/^\/$/]
}
const boundToIndex = createHandlerBoundToURL('index.html')
const navigationIndex = new NavigationRoute(boundToIndex, {
  allowlist,
  denylist: [
    /^\/lib\//,
  ]
})
registerRoute(navigationIndex)
