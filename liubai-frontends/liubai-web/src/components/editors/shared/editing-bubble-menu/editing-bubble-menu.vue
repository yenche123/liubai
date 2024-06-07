<script setup lang="ts">
import type { PropType } from 'vue';
import { BubbleMenu } from '@tiptap/vue-3'
import type { TipTapEditor } from '~/types/types-editor';
import { useI18n } from 'vue-i18n'
import { shouldShow } from '~/utils/other/bubble-menu';
import { useEditingBubbleMenu } from "./tools/useEditingBubbleMenu"

const bubbleColor = "var(--bubble-menu-color)"

defineProps({
  editor: {
    type: Object as PropType<TipTapEditor>,
  }
})

const { t } = useI18n()
const {
  tippyOptions,
  cha,
} = useEditingBubbleMenu()

</script>
<template>

  <bubble-menu
    v-if="editor && cha?.isPC"
    :editor="editor"
    :should-show="shouldShow"
    :updateDelay="250"
    :tippy-options="tippyOptions"
  >
    <!-- 编辑时: 粗体、斜体、删除线 -->
    <div class="ec-bubble-menu">
      <!-- 粗体 -->
      <div class="ec-bubble-box"
        :class="{ 'ec-bubble-box_selected': editor?.isActive('bold') }"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        <svg-icon name="editor-bold" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('editor.bold') }}</span>
      </div>

      <!-- 斜体 -->
      <div class="ec-bubble-box"
        :class="{ 'ec-bubble-box_selected': editor?.isActive('italic') }"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        <svg-icon name="editor-italic" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('editor.italic') }}</span>
      </div>

      <!-- 删除线 -->
      <div class="ec-bubble-box"
        :class="{ 'ec-bubble-box_selected': editor?.isActive('strike') }"
        @click="editor?.chain().focus().toggleStrike().run()"
      >
        <svg-icon name="editor-strike" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('editor.strike') }}</span>
      </div>
      
    </div>
  </bubble-menu>

</template>

<style scoped>

.ec-bubble-menu {
  padding: 0 10px;
  border-radius: 10px;
  display: flex;
  background-color: var(--bubble-menu-bg);
  margin: 10px;
  box-shadow: var(--bubble-menu-shadow);
}

.ec-bubble-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  font-size: var(--mini-font);
  color: var(--bubble-menu-color);
  transition: .2s;
  opacity: .6;
  cursor: pointer;
  user-select: none;
}

.ec-bubble-box:hover {
  opacity: .86;
}

.ec-bubble-box_selected {
  opacity: 1;
}

.ec-bubble-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}


</style>