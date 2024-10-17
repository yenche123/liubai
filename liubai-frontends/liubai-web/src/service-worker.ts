import { 
  cleanupOutdatedCaches, 
  createHandlerBoundToURL, 
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

console.log("[my service worker] Hello, service worker!")

self.addEventListener('message', (event) => {
  const eData = event.data
  if(!eData) return
  if(eData.type === 'SKIP_WAITING') {
    console.log("[my service worker] skip waiting")
    self.skipWaiting()
  }
})

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener("install", (evt) => {
  console.log("[my service worker] install......")
  console.log(evt)
})

// clean old assets after the new service-worker is activated
self.addEventListener("activate", (evt) => {
  console.log("[my service worker] activate......")
  cleanupOutdatedCaches()
})

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
