import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouteAndLiuRouter } from "../routes/liu-router"


// 监听和处理一些全局的事务，比如路由变化

export function useApp() {

  console.log("useApp................")

  const { router } = useRouteAndLiuRouter()

  router.beforeEach((to, from, next) => {
    next()
  })

  onBeforeRouteLeave((to, from, next) => {
    console.log("onBeforeRouteLeave............")
    console.log("to: ", to)
    console.log("from: ", from)
    next()
  })

  onBeforeRouteUpdate((to, from, next) => {
    console.log("onBeforeRouteUpdate............")
    console.log("to: ", to)
    console.log("from: ", from)
    next()
  })

}