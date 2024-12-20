<script setup lang="ts">
import AppLink from '~/components/common/app-link/app-link.vue';
import NaviLink from "~/components/common/navi-link/navi-link.vue";
import ScTop from './sc-top/sc-top.vue';
import { computed } from 'vue';
import { useSbContent } from './tools/useSbContent';
import { useSbcCursor } from './tools/useSbcCursor';
import { sbProps, type SbEmits } from "./tools/types"

const emits = defineEmits<SbEmits>()
const toClosePopup = () => {
  emits("canclosepopup")
}

const props = defineProps(sbProps)

// 用于判断 用户点击 tab 键后，是否要响应该元素，小于 0 代表不要响应
const tabindex = computed(() => {
  if(props.show) return 0
  return -1
})

const {
  t,
  state,
  prefix,
  CONNECTORS,
} = useSbContent()

const {
  cursorInfo,
  onScTopMouseEnter,
  onMouseEnter,
  onMouseLeave,
} = useSbcCursor(props)

const color = "var(--navi-normal)"
const color_selected = "var(--main-normal)"

</script>
<template>

  <div class="sb-virtual-first" />

  <!-- 移动的光标 -->
  <div class="sb-cursor" v-if="cursorInfo.enable"></div>
  
  <!-- 顶部区域 -->
  <ScTop
    @canclosepopup="toClosePopup"
    @mouseenter="onScTopMouseEnter"
    @mouseleave="onMouseLeave"
    :is-fixed="mode === 'fixed'"
  ></ScTop>

  <!-- 首页 -->
  <div class="sb-link-box sb-link-index" 
    @mouseenter="() => onMouseEnter('index')"
    @mouseleave="onMouseLeave"
  >
    <NaviLink class="liu-no-user-select sb-link" 
      :class="{ 'sb-link_selected': state === 'index' }" 
      :to="prefix"
      :tabindex="tabindex"
      @aftertap="toClosePopup"
    >
      <div class="sb-icon-container">
        <SvgIcon class="sb-icon" style="padding-block-end: 3px"
          :name="state === 'index' ? 'home_selected' : 'home'" 
          :color="state === 'index' ? color_selected : color"
        ></SvgIcon>
      </div>
      <span>{{ t("common.home") }}</span>
    </NaviLink>
  </div>
  
  <!-- 收藏 -->
  <div class="sb-link-box sb-link-favorite" 
    @mouseenter="() => onMouseEnter('favorite')"
    @mouseleave="onMouseLeave"
  >
    <NaviLink class="liu-no-user-select sb-link" 
      :class="{ 'sb-link_selected': state === 'favorite' }" 
      :to="prefix + 'favorite'"
      :tabindex="tabindex"
      @aftertap="toClosePopup"
    >
     <div class="sb-icon-container">
        <SvgIcon class="sb-icon" style="padding-block-end: 4px"
          :name="state === 'favorite' ? 'star_selected' : 'star'" 
          :color="state === 'favorite' ? color_selected : color"
        ></SvgIcon>
      </div>
      <span>{{ t("common.favorite") }}</span>
    </NaviLink>
  </div>
  

  <!-- 标签 -->
  <div class="sb-link-box sb-link-tags"
    @mouseenter="() => onMouseEnter('tags')"
    @mouseleave="onMouseLeave"
  >
    <AppLink class="liu-no-user-select sb-link" 
      to="?tags=01"
      :class="{ 'sb-link_selected': state === 'tags' }"
      :tabindex="tabindex"
    >
      <div class="sb-icon-container">
        <SvgIcon class="sb-icon" style="padding-block-end: 3px"
          name="tag" 
          :color="state === 'tags' ? color_selected : color"
        ></SvgIcon>
      </div>
      <span>{{ t("common.tags") }}</span>
    </AppLink>
  </div>
  

  <!-- 状态 -->
  <div class="sb-link-box sb-link-state"
    @mouseenter="() => onMouseEnter('state')"
    @mouseleave="onMouseLeave"
  >
    <NaviLink class="liu-no-user-select sb-link" 
      :class="{ 'sb-link_selected': state === 'state' }"
      :to="prefix + 'state'"
      :tabindex="tabindex"
      @aftertap="toClosePopup"
    >
      <div class="sb-icon-container">
        <SvgIcon class="sb-icon" 
          :name="state === 'state' ? 'priority_selected' : 'priority'" 
          :color="state === 'state' ? color_selected : color"
          :disable-stroke="state === 'state'"
        ></SvgIcon>
      </div>
      <span>{{ t("common.state") }}</span>
    </NaviLink>
  </div>

  <!-- 日程 -->
  <div class="sb-link-box sb-link-schedule"
    @mouseenter="() => onMouseEnter('schedule')"
    @mouseleave="onMouseLeave"
  >
    <NaviLink class="liu-no-user-select sb-link" 
      :to="prefix + 'schedule'"
      :class="{ 'sb-link_selected': state === 'schedule' }"
      :tabindex="tabindex"
      @aftertap="toClosePopup"
    >
      <div class="sb-icon-container">
        <SvgIcon class="sb-icon" style="padding-block-end: 1px"
          :name="state === 'schedule' ? 'schedule_selected' : 'schedule'" 
          :color="state === 'schedule' ? color_selected : color"
        ></SvgIcon>
      </div>
      <span>{{ t("calendar.schedule") }}</span>
    </NaviLink>
  </div>
  
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

.sb-cursor {
  max-width: 100%;
  width: v-bind("cursorInfo.width + 'px'");
  height: v-bind("cursorInfo.height + 'px'");
  top: 0;
  left: 0;
  translate: v-bind("'' + cursorInfo.x + 'px' + ' ' + cursorInfo.y + 'px'");
  position: absolute;
  border-radius: 8px;
  transition: .15s;
  opacity: v-bind("cursorInfo.show ? '.06' : '0'");
  background-color: var(--primary-color);
}

.sb-link-box {
  position: relative;
  margin-block-end: 6px;
}

@container sidebar (max-width: 180px) {
  .sb-link-box {
    margin-block-end: 3px;
  }
}


</style>
<style>

.sb-link {
  width: 100%;
  height: 46px;
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
  cursor: pointer;
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
  width: 36px;
  height: 36px;
}

@container sidebar (max-width: 180px) {
  .sb-link {
    font-size: var(--btn-font);
    height: 44px;
    border-radius: 8px;
  }

  .sb-icon-container {
    width: 42px;
    height: 42px;
    margin-inline-end: 8px;
  }

  .sb-icon {
    width: 24px;
    height: 24px;
  }

  .sb-link_selected .sb-icon {
    width: 32px;
    height: 32px;
  }

}


</style>