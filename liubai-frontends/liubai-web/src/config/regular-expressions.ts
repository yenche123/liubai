

export default {

  // 捕捉 @xxx@aaa.bbb
  // 其中 (?<![\w\/\-\.]+) 为负向后行断言，表示第一个 @ 前面不能接 \w \/ \. \- \\
  social_link: /(?<![\w\/\-\.\\]+)@[\w\.-]{2,32}@[\w-]{1,32}\.\w{2,32}[\w\.-]*(?!\S)/g,

  // 捕捉 [text](link) 这样格式的 markdown 链接
  md_link: /\[([^\]\n]+)\]\(([^)\n\s]+)\)/g,

  // 捕捉 email
  email: /[\w\.-]{1,32}@[\w-]{1,32}\.\w{2,32}[\w\.-]*/g,

  // 捕捉 整个字符串都是 email
  email_completed: /^[\w\.-]{1,32}@[\w-]{1,32}\.\w{2,32}[\w\.-]*$/g,

  // 捕捉 一般链接
  // 放到 if else 的最后去判断，应优先判断其他更加特殊的格式
  url: /[\w\./:-]*\w{1,32}\.\w{2,6}[^)(\n\s\"\']*/g,
  
}