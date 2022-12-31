
// 每次修改时，请记得增加版本号
const VERSION = 'v1'
const sw_caches = {
  assets: {
    name: `${VERSION}-assets`,
  },
  images: {
    name: `${VERSION}-images`,
    limit: 50,
  },
  pages: {

  }
}


// sw 安装时
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker ...', event)

  const preCache = async () => {
    const app_cache = await caches.open("app");

  }

  // event.waitUntil()
})


// sw 被激活时
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker ...', event)

})


// sw 接收到主线程 postMessage 的消息时
self.addEventListener("message", (event) => {
  console.log('[SW] 接收到消息........', event)

})