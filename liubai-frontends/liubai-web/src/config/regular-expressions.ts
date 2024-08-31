

export default {

  // 捕捉 @xxx@aaa.bbb
  // 其中 (^|[^\w\/\-\.\\]) 原来为 (?<![\w\/\-\.]+) 的负向后行断言，表示第一个 @ 前面不能接 \w \/ \. \- \\
  // 但由于 safari 16.3 以下的版本不支持负向后行断言，所以改成这样
  social_link: /(^|[^\w\/\-\.\\])(@[\w\.-]{2,32}@[\w\.-]+\.[a-z]{2,})(?!\S)/g,

  // 捕捉 [text](link) 这样格式的 markdown 链接
  md_link: /\[([^\]\n]+)\]\(([^)\n\s]+)\)/g,

  // 捕捉 email
  email: /[\w\.-]{1,32}@[\w-]{1,32}\.\w{2,32}[\w\.-]*/g,

  // 捕捉 整个字符串都是 email
  email_completed: /^[\w\.-]{1,32}@[\w-]{1,32}\.\w{2,32}[\w\.-]*$/g,

  // 严格一点的 url 正则
  exact_url: /(https?:\/\/)?(([0-9a-z.]+\.[a-z]+)|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]+)?(\/[0-9a-z%/.\-_\(\)]*)?(\?[0-9a-z=&%_\-\(\)]*)?(\#[0-9a-z=&%_\-]*)?/ig,

  // 捕捉 一般链接
  // 放到 if else 的最后去判断，应优先判断其他更加特殊的格式
  url: /[\w\./:-]*\w{1,32}\.\w{2,6}[^\n\s\"\'\[\]，。！？]*/g,

  // capture URL Scheme
  url_scheme: /[a-z][a-z0-9]{1,19}:\/\/([a-z][\w=&%\!\$\/\-\?]{0,88})?/g,

  phone: /\+?\d[\d\-]{6,15}(?!\w)/g,

  chrome_version: /chrome\/([\d\.]+)/,

  edge_version: /edg\/([\d\.]+)/,

  firefox_version: /firefox\/([\d\.]+)/,

  safari_version: /version\/([\d\.]+)/,

  ios_version: /iphone os ([\d_]+)/,
  
}