<script setup lang="ts">
import AppLink from '../../../components/common/app-link/app-link.vue';
import NaviLink from "../../../components/common/navi-link/navi-link.vue";
import SvgIcon from '../../../assets/svg-icon.vue';
import { useRouteAndLiuRouter } from '../../../routes/liu-router';
import { computed } from 'vue';

const { route } = useRouteAndLiuRouter()
const state = computed(() => {
  const n = route.name
  const q = route.query
  if(q.tags === "01") return "tags"
  if(n === "index") return "index"
  if(n === "favorite") return "favorite"
  if(n === "trash") return "trash"
  return ""
})

const color = "var(--navi-normal)"
const color_selected = "var(--main-text)"

</script>
<template>
  <div class="sb-virtual"></div>

  <!-- 首页 -->
  <NaviLink class="sb-link" 
    :class="{ 'sb-link_selected': state === 'index' }" to="/"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'index' ? 'home_selected' : 'home'" 
        :color="state === 'index' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>首页</span>
  </NaviLink>
  
  <!-- 收藏 -->
  <NaviLink class="sb-link" 
    :class="{ 'sb-link_selected': state === 'favorite' }" to="/favorite"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'favorite' ? 'star_selected' : 'star'" 
        :color="state === 'favorite' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>收藏</span>
  </NaviLink>

  <!-- 标签 -->
  <AppLink class="sb-link" to="?tags=01"
    :class="{ 'sb-link_selected': state === 'tags' }"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        name="tag" 
        :color="state === 'tags' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>标签</span>
  </AppLink>

  <!-- 回收桶 -->
  <NaviLink class="sb-link" to="/trash"
    :class="{ 'sb-link_selected': state === 'trash' }"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'trash' ? 'delete_selected' : 'delete'" 
        :color="state === 'trash' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>回收桶</span>
  </NaviLink>

</template>
<style>

.sb-virtual {
  width: 100%;
  height: 50px;
}

.sb-link {
  width: 100%;
  height: 54px;
  margin-bottom: 2px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding-left: 8px;
  font-size: var(--desc-font);
  color: var(--navi-normal);
  line-height: 1.5;
  overflow: hidden;
  position: relative;
  transition: .3s;
  user-select: none;
}

.sb-link_selected {
  color: var(--main-text);
  font-weight: 700;
}

.sb-link::before {
  transition: .15s;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  content: "";
  background-color: var(--primary-color);
  opacity: 0;
}

.sb-link:hover::before {
  opacity: .05;
}

.sb-link:active::before {
  opacity: .1;
}

.sb-icon-container {
  width: 56px;
  height: 56px;
  margin-right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sb-icon {
  width: 26px;
  height: 26px;
  transition: .15s;
}

.sb-link_selected .sb-icon {
  width: 42px;
  height: 42px;
}


</style>