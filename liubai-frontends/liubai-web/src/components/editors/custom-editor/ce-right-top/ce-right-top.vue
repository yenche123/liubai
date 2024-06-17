<script setup lang="ts">
import type { PropType } from 'vue'
import { useCeRightTop } from "./tools/useCeRightTop"
import type { TipTapEditor } from '~/types/types-editor'

const props = defineProps({
  showRightTop: {
    type: Boolean,
    default: false,
  },
  editor: {
    type: Object as PropType<TipTapEditor>,
  }
})

const bubbleColor = "var(--bubble-menu-color)"

const {
  TRANSITION_MS,
  crtData,
} = useCeRightTop(props)

</script>
<template>

  <div v-if="crtData.enable" class="crt-container"
    :class="{ 'crt-container_show': crtData.show }"
  >

    <div class="crt-box"
      :class="{ 'crt-box_show': crtData.show }"
    >

      <div class="crt-bg"></div>

      <!-- Bold -->
      <div class="liu-no-user-select crt-item"
        :class="{ 'crt-item_selected': editor?.isActive('bold') }"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        <svg-icon name="editor-bold" :color="bubbleColor" class="crt-item-icon"></svg-icon>
      </div>

      <!-- Italic -->
      <div class="liu-no-user-select crt-item"
        :class="{ 'crt-item_selected': editor?.isActive('italic') }"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        <svg-icon name="editor-italic" :color="bubbleColor" class="crt-item-icon"></svg-icon>
      </div>

      <!-- Strike -->
      <div class="liu-no-user-select crt-item"
        :class="{ 'crt-item_selected': editor?.isActive('strike') }"
        @click="editor?.chain().focus().toggleStrike().run()"
      >
        <svg-icon name="editor-strike" :color="bubbleColor" class="crt-item-icon"></svg-icon>
      </div>
    </div>

  </div>

</template>
<style lang="scss" scoped>

.crt-container {
  width: 100%;
  height: 50px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 500;
  opacity: 0;
  transition: v-bind("TRANSITION_MS + 'ms'");
  border-top-left-radius: var(--ce-border-radius);
  border-top-right-radius: var(--ce-border-radius);
  overflow: hidden;
}

.crt-container_show {
  opacity: 1;
}

.crt-box {
  position: relative;
  width: 100%;
  height: 100%;
  padding-inline-end: 10px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  box-sizing: border-box;
  transform: translateY(-100%);
  transition: v-bind("TRANSITION_MS + 'ms'");
}

.crt-bg {
  width: 70%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 30%;
  background: var(--gradient-three);
}

.crt-box_show {
  transform: translateY(0);
}

.crt-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 6px;
  font-size: var(--mini-font);
  color: var(--bubble-menu-color);
  transition: .2s;
  opacity: .6;
  cursor: pointer;
}

.crt-item:hover {
  opacity: .86;
}

.crt-item_selected {
  opacity: .99;
}

.crt-item-icon {
  width: 30px;
  height: 30px;
}






</style>