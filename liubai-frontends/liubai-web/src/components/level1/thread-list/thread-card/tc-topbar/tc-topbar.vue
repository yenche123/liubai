<script setup lang="ts">
import { type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ThreadShow } from '~/types/types-content';
import { useTcTopbar } from './tools/useTcTopbar';
import type { TctEmits } from "./tools/types"
import StateBadge from '~/components/common/state-badge/state-badge.vue';
import AiCharacterBadge from './ai-character-badge/ai-character-badge.vue';

const props = defineProps({
  threadData: {
    type: Object as PropType<ThreadShow>,
    required: true
  }
})

defineEmits<TctEmits>()
const { t } = useI18n()
const { 
  td,
  showTopbar,
  cloudOffPlacement,
  aiCharacterUrl,
  onTapAiCharacter,
} = useTcTopbar(props)


</script>
<template>
  <div v-if="showTopbar" class="tct-container">

    <!-- 存储位置: 本地存储时，显示图标 -->
    <div class="tct-item-container" 
      v-if="td.storageState === 'LOCAL' || td.storageState === 'ONLY_LOCAL'"
    >
      <LiuTooltip
        :aria-label="t('thread_related.saved_locally')"
        :distance="2"
        :placement="cloudOffPlacement"
      >
        <svg-icon class="tct-local-svg" color="var(--main-tip)"
          name="cloud_off"
        ></svg-icon>
      </LiuTooltip>
    </div>

    <!-- ai character -->
    <div v-if="aiCharacterUrl && td.aiCharacter" 
      class="tct-item-container tct-ai-box"
      @click.stop="onTapAiCharacter"
    >
      <AiCharacterBadge
        :ai-character="td.aiCharacter"
        :icon-url="aiCharacterUrl"
      ></AiCharacterBadge>
    </div>

    <!-- 状态 -->
    <StateBadge v-if="td.stateShow" :state-show="td.stateShow" 
      @tapstate="$emit('newoperate', 'state')"
      class="tct-item-container"
    ></StateBadge>
    
    <!-- 置顶 -->
    <svg v-if="td.pinStamp" class="tct-pin" viewBox="-50 -50 300 300">
      <polygon class="tct-triangle" stroke-linejoin="round" points="20,-20 220,-20 220,180"/>
    </svg>

  </div>
</template>
<style lang="scss" scoped>

.tct-container {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  position: relative;
  padding-block-end: 5px;

  .tct-pin {
    margin-inline-start: 10px;
    width: 14px;
    height: 14px;
    border-top-right-radius: 4px;
    overflow: hidden;
    position: relative;

    .tct-triangle {
      fill: var(--main-tip);
      stroke: var(--main-tip);
      stroke-width: 60;
    }
  }

}

.tct-item-container {
  position: relative;
  padding-inline-start: 14px;
}

.tct-ai-box {
  cursor: pointer;
}

.tct-local-svg {
  width: 20px;
  height: 20px;
  outline: 0;
}



</style>