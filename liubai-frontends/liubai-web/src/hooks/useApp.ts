import { useRouteAndLiuRouter } from "../routes/liu-router"
import liuApi from "../utils/liu-api"
import liuUtil from "../utils/liu-util"
import VConsole from 'vconsole';
import { init as initForSystem } from "../utils/system/init"

// 监听和处理一些全局的事务，比如路由变化

export function useApp() {
  const { router } = useRouteAndLiuRouter()

  router.beforeEach((to, from, next) => {
    next()
  })

  const env = liuUtil.getEnv()
  const cha = liuApi.getCharacteristic()
  if(env.DEV && (cha.isMobile || cha.isIPadOS)) {
    new VConsole()
  }

  initForSystem()
}