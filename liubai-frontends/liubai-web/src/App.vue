<script setup lang="ts">
import WhoAreYou from "./components/level1/who-are-you/who-are-you.vue"
import TrustDetection from "./components/level1/trust-detection/trust-detection.vue"
import GlobalLoading from "./components/loaders/global-loading/global-loading.vue"
import { useApp } from "./hooks/useApp";
import { initLiuRouter } from "./routes/liu-router"
import { defineAsyncComponent } from "vue"
import time from "~/utils/basic/time"

time.whenAppSetup()

const CustomUi = defineAsyncComponent(() => {
  return import("./components/custom-ui/custom-ui.vue")
})

const { cha } = useApp()
const { route } = initLiuRouter()
const ios_ipad = Boolean(cha.isIOS || cha.isIPadOS)

</script>

<template>
  
  <div 
    class="app-container"
    :class="{ 'liu-ios-device': ios_ipad }"
  >

    <!-- 侧边栏视图 -->
    <router-view name="LeftSidebar" v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    
    <!-- 默认视图 -->
    <router-view v-if="route.meta.keepAlive !== false" v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <router-view v-else></router-view>

    <!-- TODO: router-view 底部导航栏 -->
    
    <custom-ui />
    <who-are-you />
    <TrustDetection></TrustDetection>
    <GlobalLoading></GlobalLoading>
  </div>
</template>

<style scoped>

.app-container {
  height: max-content;
  min-height: 100%;
  min-width: 250px;
}

</style>
