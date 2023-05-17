<script setup lang="ts">
import AppLink from '~/components/common/app-link/app-link.vue';
import NaviLink from "~/components/common/navi-link/navi-link.vue";
import ScTop from './sc-top/sc-top.vue';
import { computed, PropType } from 'vue';
import { useSbContent } from './tools/useSbContent';

const emits = defineEmits<{
  (event: "canclosepopup"): void
}>()

const toClosePopup = () => {
  emits("canclosepopup")
}

const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
  mode: {
    type: String as PropType<"fixed" | "common">,
    default: "common"
  },
})

// 用于判断 用户点击 tab 键后，是否要响应该元素，小于 0 代表不要响应
const tabindex = computed(() => {
  if(props.show) return 0
  return -1
})

const {
  t,
  state,
  prefix,
} = useSbContent()

const color = "var(--navi-normal)"
const color_selected = "var(--main-normal)"

</script>
<template>

  <div class="sb-virtual-first" />
  
  <!-- 顶部区域 -->
  <ScTop
    @canclosepopup="toClosePopup"
    :is-fixed="mode === 'fixed'"
  ></ScTop>

  <!-- 首页 -->
  <NaviLink class="sb-link liu-hover" 
    :class="{ 'sb-link_selected': state === 'index' }" 
    :to="prefix"
    :tabindex="tabindex"
    @aftertap="toClosePopup"
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
    :class="{ 'sb-link_selected': state === 'favorite' }" 
    :to="prefix + 'favorite'"
    :tabindex="tabindex"
    @aftertap="toClosePopup"
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
  <AppLink class="sb-link liu-hover" 
    to="?tags=01"
    :class="{ 'sb-link_selected': state === 'tags' }"
    :tabindex="tabindex"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        name="tag" 
        :color="state === 'tags' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>{{ t("common.tags") }}</span>
  </AppLink>

  <!-- 状态 -->
  <NaviLink class="sb-link liu-hover" 
    :to="prefix + 'state'"
    :class="{ 'sb-link_selected': state === 'state' }"
    :tabindex="tabindex"
    @aftertap="toClosePopup"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'state' ? 'priority_selected' : 'priority'" 
        :color="state === 'state' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>{{ t("common.state") }}</span>
  </NaviLink>

  <!-- 连接 -->
  <NaviLink class="sb-link liu-hover" 
    :to="prefix + 'connect'"
    :class="{ 'sb-link_selected': state === 'connect' }"
    :tabindex="tabindex"
    @aftertap="toClosePopup"
  >
    <div class="sb-icon-container">
      <SvgIcon class="sb-icon" 
        :name="state === 'connect' ? 'hub_selected' : 'hub'" 
        :color="state === 'connect' ? color_selected : color"
      ></SvgIcon>
    </div>
    <span>{{ t("common.connects") }}</span>
  </NaviLink>

  <div class="sb-virtual"></div>

</template>

<style lang="scss" scoped>

.sb-virtual-first {
  width: 100%;
  height: 20px;
}

.sb-virtual {
  width: 100%;
  height: 50px;
}

</style>
<style>

.sb-link {
  width: 100%;
  height: 48px;
  margin-block-end: 8px;
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
  width: 46px;
  height: 46px;
  margin-inline-end: 10px;
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
  width: 38px;
  height: 38px;
}


</style>