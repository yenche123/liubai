<script setup lang="ts">
import { useNaviAuto } from "./tools/useNaviAuto"
import cfg from "../../../config"

const naviHeightPx = `${cfg.navi_height}px`

const {
  enable,
  show,
  shadow,
  TRANSITION_DURATION,
  onTapMenu,
  onTapTitle,
} = useNaviAuto()

const default_color = "var(--navi-normal)"

</script>
<template>

  <div v-if="enable"
    class="liu-frosted-glass na-container"
    :class="{ 'na-container_show': show, 'na-container_shadow': shadow }"
  >

    <div class="na-box">

      <div class="liu-hover na-menu-box" @click="onTapMenu">
        <svg-icon class="na-menu-icon" 
          :color="default_color"
          name="stair_menu"
        ></svg-icon>
      </div>

      <div class="na-title" @click="onTapTitle">
        <div class="na-title-inner">
          <span>留白记事</span>
        </div>
      </div>

      <div class="na-menu-box"></div>
    </div>

  </div>


</template>
<style lang="scss" scoped>

.na-container {
  position: sticky;
  top: 0;
  width: 100%;
  height: v-bind("naviHeightPx");
  max-height: 0;
  opacity: .3;
  overflow: hidden;
  display: flex;
  justify-content: center;
  transition: v-bind("TRANSITION_DURATION + 'ms'");
  transform: translateY(-100%);
  z-index: 550;

  .na-box {
    width: 92%;
    height: 100%;
    max-width: var(--card-max);
    min-width: var(--card-min);
    display: flex;
    align-items: center;
    position: relative;

    .na-menu-box {
      width: 40px;
      height: 40px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;

      .na-menu-icon {
        width: 26px;
        height: 26px;
      }
    }

    .na-title {
      flex: 1;
      display: flex;
      justify-content: center;
      position: relative;
      

      .na-title-inner {
        display: flex;
        text-align: center;
        font-size: var(--desc-font);
        color: v-bind("default_color");
        line-height: 1.5;
        font-weight: 700;
        user-select: none;
        cursor: pointer;
      }

    }

  }
}

.na-container_show {
  transform: translateY(0);
  max-height: v-bind("naviHeightPx");
  opacity: 1;
}

.na-container_shadow {
  box-shadow: 0 5px 15px rgba(0, 0, 0, .1);
}

.na-container_shadow::before {
  content: "";
  position: absolute;
  background: var(--frosted-glass-4);
}


</style>