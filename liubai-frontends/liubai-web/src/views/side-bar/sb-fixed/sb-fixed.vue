<script lang="ts" setup>
import { initFixedSideBar } from "./index"
import SbContent from '../sb-content/sb-content.vue';
import SbTags from '../sb-tags/sb-tags.vue';

interface SbProps {
  expandState: "tags" | ""
}

defineProps<SbProps>()

const {
  enable,
  show,
  TRANSITION_DURATION,
  onTapPopup,
} = initFixedSideBar()


</script>
<template>

  <div v-if="enable" 
    class="sb-fixed"
  >

    <div class="sf-bg"
      :class="{ 'sf-bg_show': show }"
      @click="onTapPopup"
    ></div>

    <div class="sf-container"
      :class="{ 'sf-container_show': show }"
    >
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
    opacity: 0;
    transition: v-bind("TRANSITION_DURATION + 'ms'");
  }

  .sf-bg_show {
    opacity: 1;
  }
}

.sf-container {
  display: flex;
  width: 86vw;
  height: 100vh;
  max-width: 400px;
  min-width: 250px;
  position: relative;
  background-color: var(--bg-color);
  overflow: hidden;
  z-index: 755;
  transition: v-bind("TRANSITION_DURATION + 'ms'");
  transform: translateX(-110%);
  box-shadow: 10px 0 10px rgba(0, 0, 0, .2);
}

.sf-container_show {
  transform: translateX(0);
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


</style>