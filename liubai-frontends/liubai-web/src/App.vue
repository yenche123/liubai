<script setup lang="ts">
import CustomUi from "./components/custom-ui/custom-ui.vue"
import { useDynamics } from "./hooks/useDynamics"
import { initLiuRouter } from "./routes/liu-router"

const { route } = initLiuRouter()
const { theme } = useDynamics()

</script>

<template>

  <!-- theme-common 放在 theme.css 文件里 -->
  <!-- theme-light 放在 theme-light.css 文件里 -->
  <!-- theme-dark 放在 theme-dark.css 文件里 -->
  <div 
    class="app-container theme-common theme-light"
    :class="{ 'theme-dark': theme === 'dark' }"
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
  </div>
</template>

<style scoped>

.app-container {
  height: max-content;
  min-height: 100%;
  min-width: 250px;
}

</style>
