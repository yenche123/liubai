if('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pwa/sw.js', { scope: '/' }).then(res => {
      console.log("sw 注册成功........")
      console.log(res)
    }).catch(err => {
      console.log("sw 注册失败........")
      console.log(res)
    })
  })
}