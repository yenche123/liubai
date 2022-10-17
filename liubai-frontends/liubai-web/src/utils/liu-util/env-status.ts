


export function getEnv() {
  const DEV = import.meta.env.DEV
  const API_URL = import.meta.env.VITE_API_URL
  return {
    DEV,
    API_URL,
  }
}

/** 从环境变量里判断，是否具备后端的配置，若无，则为纯本地应用 */
export function getIfPurelyLocal() {
  const env = getEnv()
  if(!env.API_URL) return true
  return false
}