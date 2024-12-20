<script lang="ts" setup>
import { initFixedSideBar } from "./index"
import SbContent from '../sb-content/sb-content.vue';
import SbTags from '../sb-tags/sb-tags.vue';
import { useSbfTouch } from "./tools/useSbfTouch";
import { type SbfProps } from "./tools/types"

defineProps<SbfProps>()

const {
  TRANSITION_DURATION,
  sbfData,
  onTapPopup,
  onPopupTouchStart,
  onPopupTouchEnd,
  toOpen,
  toClose,
} = initFixedSideBar()

const {
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
} = useSbfTouch(sbfData, toOpen, toClose)


</script>
<template>

  <div v-if="sbfData.enable" 
    class="sb-fixed"
    @touchstart="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
    @touchcancel.passive="onTouchCancel"
  >

    <div class="sf-bg"
      @click.stop="onTapPopup"
      @touchstart.passive="onPopupTouchStart"
      @touchend.passive="onPopupTouchEnd"
    ></div>

    <div class="sf-container">

      <!-- background image -->
      <div class="sfc-bg">
        <div class="sfc-bg-mask"></div>
      </div>

      <!-- 主侧边栏 -->
      <div class="sf-box"
        :class="{ 'sf-main_hidden': expandState === 'tags' }"
      >
        <div class="sf-inner-box">
          <SbContent :show="expandState === ''"
            @canclosepopup="onTapPopup"
            mode="fixed"
          ></SbContent>
        </div>
      </div>

      <!-- 标签栏 -->
      <div class="sf-box sf-other_hidden"
        :class="{ 'sf-other_show': expandState === 'tags' }"
      >
        <div class="sf-inner-box">
          <SbTags :show="expandState === 'tags'"
            @aftertap="onTapPopup"
          ></SbTags>
        </div>        
      </div>

    </div>


  </div>

</template>
<style lang="scss" scoped>

.sb-fixed {
  position: fixed;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  z-index: 750;
  top: 0;
  left: 0;

  .sf-bg {
    width: 100%;
    height: 100%;
    z-index: 751;
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, .75);
    opacity: v-bind("sbfData.bgOpacity");
    transition: v-bind("sbfData.duration");
  }
}

.sf-container {
  display: flex;
  width: 82vw;
  height: 100vh;
  height: 100dvh;
  max-width: 400px;
  min-width: 220px;
  position: relative;
  background-color: var(--bg-color);
  overflow: hidden;
  z-index: 755;
  transition: v-bind("sbfData.duration");
  transform: v-bind("'translateX(' + sbfData.distance + ')'");
  box-shadow: 10px 0 10px rgba(0, 0, 0, .16);
}

.sf-box {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
  justify-content: center;
  position: relative;
  transition: v-bind("TRANSITION_DURATION + 'ms'");
  scrollbar-color: transparent transparent;

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    transition: .15s;
  }

  &:hover {
    scrollbar-color: var(--scrollbar-thumb) transparent;
  }

  &:hover::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb);
  }

  .sf-inner-box {
    width: 90%;
    height: max-content;
    position: relative;
  }
}

.sf-main_hidden {
  transform: translateX(-101%);
}

.sf-other_hidden {
  opacity: 0;
}

.sf-other_show {
  opacity: 1;
  transform: translateX(-100%);
}


.sfc-bg {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  background-color: var(--sidebar-bg);
  width: 100%;
  height: 100%;
}

.sfc-bg::before {
  width: 100%;
  height: 100%;
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  background-image: v-bind("bgSrc");
  background-size: cover;
  background-position: left;
}

.sfc-bg-mask {
  -webkit-backdrop-filter: blur(var(--blur-radius));
  backdrop-filter: blur(var(--blur-radius));
  width: 100%;
  height: 100%;
  background: var(--frosted-glass);
}


</style>