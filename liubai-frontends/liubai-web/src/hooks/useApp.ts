import { useRouteAndLiuRouter } from "../routes/liu-router"


// 监听和处理一些全局的事务，比如路由变化

export function useApp() {

  console.log("useApp................")

  const { router } = useRouteAndLiuRouter()

  router.beforeEach((to, from, next) => {
    next()
  })

}