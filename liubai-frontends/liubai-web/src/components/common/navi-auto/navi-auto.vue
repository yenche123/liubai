<script setup lang="ts">
import { useNaviAuto } from "./tools/useNaviAuto"
import cfg from "~/config"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const naviHeightPx = `${cfg.navi_height}px`

const emits = defineEmits<{
  (event: "naviautochangeed", newV: boolean): void
}>()

const {
  containerEl,
  naData,
  TRANSITION_DURATION,
  onTapMenu,
  onTapTitle,
} = useNaviAuto(emits)

const default_color = "var(--navi-normal)"

</script>
<template>

  <div v-if="naData.enable"
    ref="containerEl"
    class="liu-frosted-glass na-container"
    :class="{ 
      'na-container_show': naData.show, 
      'na-container_shadow': naData.shadow,
    }"
  >

    <div class="na-box">

      <div class="liu-hover na-menu-box" @click="onTapMenu"
        style="margin-inline-start: -6px;"
      >
        <svg-icon class="na-menu-icon" 
          :color="default_color"
          name="stair_menu"
        ></svg-icon>
      </div>

      <div class="na-title" @click="onTapTitle">
        <div class="liu-no-user-select na-title-inner">
          <span>{{ t('hello.appName') }}</span>
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
    width: var(--card-percent);
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, .07);
}

.na-container_shadow::before {
  content: "";
  position: absolute;
  background: var(--frosted-glass-4);
}


</style>