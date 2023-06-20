<script setup lang="ts">
import WhoAreYou from "./components/level1/who-are-you/who-are-you.vue"
import GlobalLoading from "./components/loaders/global-loading/global-loading.vue"
import { useApp } from "./hooks/useApp";
import { initLiuRouter } from "./routes/liu-router"
import { defineAsyncComponent } from "vue"

const CustomUi = defineAsyncComponent(() => {
  return import("./components/custom-ui/custom-ui.vue")
})

useApp()
const { route } = initLiuRouter()

</script>

<template>
  
  <div 
    class="app-container"
  >

    <!-- 侧边栏视图 -->
    <router-view name="LeftSidebar" v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    
    <!-- 默认视图 -->
    <router-view v-if="route.meta.keepAlive" v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <router-view v-else></router-view>
    
    <custom-ui />
    <who-are-you />
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
