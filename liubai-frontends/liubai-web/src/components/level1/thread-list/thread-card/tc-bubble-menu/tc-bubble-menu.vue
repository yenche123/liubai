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
      selectedIndex,
      tippyOptions,
      onTapCopy,
      onTapSearchIn,
      onTapSearchOut,
      onTapBot,
    } = useTcBubbleMenu(props)

    return {
      t,
      bubbleColor,
      shouldShow,
      selectedIndex,
      tippyOptions,
      onTapCopy,
      onTapSearchIn,
      onTapSearchOut,
      onTapBot,
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
        :class="{ 'ec-bb-two_selected': selectedIndex === 0 }"
        @click="onTapCopy"
      >
        <svg-icon name="copy" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('card_bubble.copy') }}</span>
      </div>

      <!-- 站内搜索 -->
      <div class="ec-bb-two"
        :class="{ 'ec-bb-two_selected': selectedIndex === 1 }"
        @click="onTapSearchIn"
      >
        <svg-icon name="search" :color="bubbleColor" class="ec-bubble-icon"></svg-icon>
        <span>{{ t('card_bubble.search_in') }}</span>
      </div>

      <!-- 站外搜索 -->
      <div class="ec-bb-two"
        :class="{ 'ec-bb-two_selected': selectedIndex === 2 }"
        @click="onTapSearchOut"
      >
        <svg-icon name="logos-google" :color="bubbleColor" class="ec-bubble-icon ec-bubble-outside"></svg-icon>
        <span>{{ t('card_bubble.search_out') }}</span>
      </div>

      <!-- ChatGPT -->
      <!-- <div class="ec-bb-two"
        :class="{ 'ec-bb-two_selected': selectedIndex === 3 }"
        @click="onTapBot"
      >
        <svg-icon name="logos-openai" :color="bubbleColor" class="ec-bubble-icon ec-bubble-chatgpt"></svg-icon>
        <span>{{ t('card_bubble.ask_bot') }}</span>
      </div> -->
      
    </div>

  </bubble-menu>

</template>
<style scoped>


.ec-bubble-menu {
  padding: 0 10px;
  border-radius: 10px;
  display: flex;
  background-color: var(--bubble-menu-bg);
  margin-top: 10px;
  margin-bottom: 10px;
  box-shadow: var(--bubble-menu-shadow);
  width: fit-content;
  flex-wrap: wrap;
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
  position: relative;
  min-width: 50px;
  text-align: center;
}

.ec-bb-two::before {
  content: "";
  position: absolute;
  opacity: 0;
  transition: .1s;
  top: 5px;
  left: 5px;
  width: calc(100% - 10px);
  height: calc(100% - 10px);
  background-color: var(--bubble-menu-color);
  border-radius: 5px;
  overflow: hidden;
}

.ec-bb-two:hover {
  opacity: .7;
}

.ec-bb-two_selected::before {
  opacity: 0.1;
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

.ec-bubble-chatgpt {
  width: 19px;
  height: 19px;
  margin-top: 2px;
  margin-bottom: 7px;
}


</style>