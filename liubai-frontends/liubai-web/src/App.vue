<script setup lang="ts">
import CustomUi from "./components/custom-ui/custom-ui.vue"
import WhoAreYou from "./components/level1/who-are-you/who-are-you.vue"
import { useApp } from "./hooks/useApp";
import { initLiuRouter } from "./routes/liu-router"

useApp()
const { route } = initLiuRouter()

</script>

<template>

  <!-- theme-common 放在 theme.css 文件里 -->
  <!-- theme-light 放在 theme-light.css 文件里 -->
  <!-- theme-dark 放在 theme-dark.css 文件里 -->
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
  </div>
</template>

<style scoped>

.app-container {
  height: max-content;
  min-height: 100%;
  min-width: 250px;
}

</style>
