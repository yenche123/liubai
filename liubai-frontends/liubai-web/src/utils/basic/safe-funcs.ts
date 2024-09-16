

export function setStorageSafely(
  key: string,
  val: string,
  printErr: boolean = true,
) {
  try {
    localStorage.setItem(key, val)
    return true
  }
  catch(err) {
    if(printErr) console.warn("setStorageSafely err: ", err)
  }
  return false
}

export function getStorageSafely(
  key: string,
  printErr: boolean = true,
) {
  try {
    return localStorage.getItem(key)
  }
  catch(err) {
    if(printErr) console.warn("getStorageSafely err: ", err)
  }
  return null
}