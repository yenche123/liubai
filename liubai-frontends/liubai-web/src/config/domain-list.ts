// 一些网页

// 没有设置 x-frame-options 的网站
export const domainAllowed = [
  "u1s1.site",
  "podcastogether.com",
  "ruanyifeng.com",
  "ghost.io",
  "cubox.pro",
  "pod.link",
  "zhubai.love",
  "xiaoyuzhoufm.com",
  "quail.ink",
  "yuque.com",
  "juejin.cn",
  "eleduck.com",
  "feishu.cn",
  "okjike.com",
  "inside.com.tw",
  "bilibili.com",
  "flowus.cn",
  "gcores.com",
  "sspai.com",
  "douban.com",
  "zhiy.cc",       // 背景需要调成白色
  "hedwig.pub",
  "beehiiv.com",
  "lusun.com",
]

// 即使用 proxy 打开，也会有异常的网页
export const domainNotAllowed = [
  "google.com",
  "medium.com",
  "spotify.com",
  "elk.zone",
  "chat.openai.com",
  "zhihu.com",
  "xiaohongshu.com",
  "notion.site",
  "notion.so",
  "facebook.com",
  "every.to",
  "msn.com",
  "threads.net",
]

// 一些需要特殊处理的 domain，比如支持 embed 的网页
export const domainSpecial = [
  "youtube.com",
  "bilibili.com",
  "loom.com",
]