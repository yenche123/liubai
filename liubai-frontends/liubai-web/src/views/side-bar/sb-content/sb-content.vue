<script setup lang="ts">
import AppLink from '../../../components/common/app-link/app-link.vue';
import NaviLink from "../../../components/common/navi-link/navi-link.vue";
import { useRouteAndLiuRouter } from '../../../routes/liu-router';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()

const { route } = useRouteAndLiuRouter()
const state = computed(() => {
  const n = route.name
  const q = route.query
  if(q.tags === "01") return "tags"
  if(n === "index") return "index"
  if(n === "favorite") return "favorite"
  if(n === "kanban") return "kanban"
  if(n === "trash") return "trash"
  if(n === "connect") return "connect"
  return ""
})

const color = "var(--navi-normal)"
const color_selected = "var(--main-normal)"

</script>
<template>
  <div class="sb-virtual"></div>

  <!-- 首页 -->
  <NaviLink class="sb-link liu-hover" 
    :class="{ 'sb-link_selected': state === 'index' }" to="/"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'index' ? 'home_selected' : 'home'" 
        :color="state === 'index' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>{{ t("common.home") }}</span>
  </NaviLink>
  
  <!-- 收藏 -->
  <NaviLink class="sb-link liu-hover" 
    :class="{ 'sb-link_selected': state === 'favorite' }" to="/favorite"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'favorite' ? 'star_selected' : 'star'" 
        :color="state === 'favorite' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>{{ t("common.favorite") }}</span>
  </NaviLink>

  <!-- 标签 -->
  <AppLink class="sb-link liu-hover" to="?tags=01"
    :class="{ 'sb-link_selected': state === 'tags' }"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        name="tag" 
        :color="state === 'tags' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>{{ t("common.tags") }}</span>
  </AppLink>

  <!-- 看板 -->
  <NaviLink class="sb-link liu-hover" to="/kanban"
    :class="{ 'sb-link_selected': state === 'kanban' }"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'kanban' ? 'kanban_selected' : 'kanban'" 
        :color="state === 'kanban' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>{{ t("common.kanban") }}</span>
  </NaviLink>

  <!-- 连接 -->
  <NaviLink class="sb-link liu-hover" to="/connect"
    :class="{ 'sb-link_selected': state === 'connect' }"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'connect' ? 'hub_selected' : 'hub'" 
        :color="state === 'connect' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>{{ t("common.connects") }}</span>
  </NaviLink>

  <!-- 回收桶 -->
  <NaviLink class="sb-link liu-hover" to="/trash"
    :class="{ 'sb-link_selected': state === 'trash' }"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'trash' ? 'delete_selected' : 'delete'" 
        :color="state === 'trash' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>{{ t("common.trash") }}</span>
  </NaviLink>

</template>
<style>

.sb-virtual {
  width: 100%;
  height: 50px;
}

.sb-link {
  width: 100%;
  height: 50px;
  margin-bottom: 8px;
  border-radius: 10px;
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
  letter-spacing: 1px;
}

.sb-link_selected {
  color: var(--main-normal);
  font-weight: 700;
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
  width: 28px;
  height: 28px;
  transition: .15s;
}

.sb-link_selected .sb-icon {
  width: 40px;
  height: 40px;
}


</style>