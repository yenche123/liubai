import reg_exp from "~/config/regular-expressions";


/**
 * 检查 val 是否为 email
 * @param val 需要验证的字符串
 */
function isEmail(val: string) {
  // 最短的 email 应该长这样 a@b.cn 至少有 6 个字符
  if(val.length < 6) {
    return false
  }

  // 使用正则判断是否为 email
  const m = val.match(reg_exp.email_completed)
  let isEmail = Boolean(m?.length)
  if(!isEmail) return false

  // 确保第一个字符和最后一个字符 不会是 \. 和 -
  const tmps = [".", "-"]
  const firstChar = val[0]
  if(tmps.includes(firstChar)) return false
  const lastChar = val[val.length - 1]
  if(tmps.includes(lastChar)) return false

  return true
}

export default {
  isEmail,
}