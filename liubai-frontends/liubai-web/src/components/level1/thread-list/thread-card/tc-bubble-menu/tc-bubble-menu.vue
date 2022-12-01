<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { BubbleMenu } from '@tiptap/vue-3'
import type { TipTapEditor } from '../../../../../types/types-editor';
import { useI18n } from 'vue-i18n'
import { shouldShow } from '../../../../../utils/other/bubble-menu';
import { useTcBubbleMenu } from "./tools/useTcBubbleMenu"

const bubbleColor = "var(--bubble-menu-color)"

export default defineComponent({
  components: {
    BubbleMenu,
  },
  props: {
    editor: {
      type: Object as PropType<TipTapEditor>,
    }
  },
  setup(props) {
    const { t } = useI18n()
    const {
      tippyOptions,
      onTapCopy,
      onTapSearchIn,
      onTapSearchOut,
    } = useTcBubbleMenu(props)

    return {
      t,
      bubbleColor,
      shouldShow,
      tippyOptions,
      onTapCopy,
      onTapSearchIn,
      onTapSearchOut,
    }
  }
})

</script>
<template>

  <bubble-menu
    v-if="editor"
    :editor="editor"
    :should-show="shouldShow"
    :updateDelay="250"
    :tippy-options="tippyOptions"
  >

    <!-- 浏览时: 复制、内部搜索、外部搜索 -->
    <div class="ec-bubble-menu">
      <!-- 复制 -->
      <div class="ec-bb-two"
        @click="onTapCopy"
      >
        <svg-icon name="copy" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('card_bubble.copy') }}</span>
      </div>

      <!-- 站内搜索 -->
      <div class="ec-bb-two"
        @click="onTapSearchIn"
      >
        <svg-icon name="search" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('card_bubble.search_in') }}</span>
      </div>

      <!-- 站外搜索 -->
      <div class="ec-bb-two"
        @click="onTapSearchOut"
      >
        <svg-icon name="google" :color="bubbleColor" class="ec-bubble-icon ec-bubble-outside"></svg-icon>
        <span>{{ t('card_bubble.search_out') }}</span>
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

.ec-bb-two {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  font-size: var(--mini-font);
  color: var(--bubble-menu-color);
  transition: .15s;
  opacity: .96;
  cursor: pointer;
  user-select: none;
}

.ec-bb-two:hover {
  opacity: .7;
}

.ec-bubble-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.ec-bubble-outside {
  width: 22px;
  height: 22px;
  margin-bottom: 6px;
}


</style>