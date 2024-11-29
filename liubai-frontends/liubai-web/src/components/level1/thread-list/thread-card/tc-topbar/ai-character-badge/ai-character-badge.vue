<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type PropType, computed } from 'vue';
import { type AiCharacter } from '~/types/types-atom';

const props = defineProps({
  aiCharacter: {
    type: String as PropType<AiCharacter>,
    required: true,
  },
  iconUrl: {
    type: String,
    required: true,
  }
})

const mainColor = computed(() => {
  const a = props.aiCharacter
  return `var(--${a}-color)`
})

const { t } = useI18n()

</script>
<template>

  <div class="state-badge-container">
    
    <div class="liu-no-user-select tct-state-box" :style="{
      'color': mainColor,
    }">
      <!-- bg color -->
      <div class="tctsb-bg" :style="{
        'background-color': mainColor
      }"></div>

      <!-- icon -->
      <div class="tct-ai-character" :class="{
        'tct-ai-deepseek': aiCharacter === 'deepseek',
      }"></div>

      <span class="tctsb-text">{{ t(`ai_character.${aiCharacter}`) }}</span>
    </div>

  </div>

</template>
<style scoped lang="scss">

.state-badge-container {
  position: relative;
  width: fit-content;
}

.tct-state-box {
  padding: 2px 8px;
  border-radius: 2px 10px 2px 10px;
  min-width: 50px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: .15s;
  display: flex;
  justify-content: center;
  align-items: center;

  .tctsb-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: .11;
  }
}

.tct-ai-character {
  width: 16px;
  height: 16px;
  background-image: v-bind("'url(/images/third-party/' + iconUrl + ')'");
  background-size: cover;
  background-repeat: no-repeat;
  overflow: hidden;
  border-radius: 50%;
  margin-inline-end: 5px;
}

.tct-ai-deepseek {
  height: 11.68px;
  border-radius: 0;
}


.tctsb-text {
  font-size: var(--state-font);
  opacity: .8;
}


@media(hover: hover) {
  .tct-state-box:hover {
    opacity: .8;
  }
}


</style>