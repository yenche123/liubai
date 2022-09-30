<script setup lang="ts">
import SideBar from './views/side-bar/side-bar.vue';
import { initLiuRouter } from "./routes/liu-router"

const { route } = initLiuRouter()


</script>

<template>
  <div class="app-container">

    <!-- 应用内侧边栏 （不包括设置页的侧边栏） -->
    <side-bar v-if="route.meta.sidebar"></side-bar>
    
    <router-view v-if="route.meta.keepAlive" v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <router-view v-else></router-view>
    
  </div>
</template>

<style scoped>

.app-container {
  height: max-content;
  min-height: 100%;
  min-width: 250px;
}

</style>
