

// 存储 pathname 即可
const fetchedList: string[] = []

async function prefetchLink(e: MouseEvent) {
  const link = e.target as HTMLElement
  if(!link) return
  const href = link.getAttribute("href")
  if(!href) return

  const nowUrl = new URL(location.href)
  const theUrl = new URL(href, nowUrl)

  if(theUrl.hostname !== nowUrl.hostname) return
  if(theUrl.pathname === nowUrl.pathname) return
  if(checkHasFetched(theUrl)) return

  try {
    const res = await fetch(href)
    if(res.status === 200) {
      addToFetchedList(theUrl)
    }
    
  }
  catch(err) {
    console.warn("prefetch link failed......")
    console.log(err)
    console.log(" ")
    return
  }
  
  return true
}

function checkHasFetched(theUrl: URL) {
  const path = theUrl.pathname
  const existed = fetchedList.includes(path)
  return existed
}

function addToFetchedList(theUrl: URL) {
  const path = theUrl.pathname
  const existed = fetchedList.includes(path)
  if(existed) return
  fetchedList.push(path)
}

export default {
  prefetchLink,
}