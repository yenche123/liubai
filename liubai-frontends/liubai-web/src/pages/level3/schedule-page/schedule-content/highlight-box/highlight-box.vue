<script setup lang="ts">
import { type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHighlightBox } from './tools/useHighlightBox';

defineProps({
  titleKey: {
    type: String,
    required: true,
  },
  titleKeyOpt: {
    type: Object as PropType<Record<string, any>>,
  },
  iconColor: {
    type: String,
    default: "var(--primary-color)",
  }
})

const { show, onTapClose } = useHighlightBox()
const { t } = useI18n()

</script>
<template>
  <div class="highlight-container" :class="{ 'highlight-container_shown': show }">
    <div class="liu-highlight-box highlight-box">
      <div class="liu-no-user-select highlight-tip">
        <span v-if="titleKeyOpt">{{ t(titleKey, titleKeyOpt) }}</span>
        <span v-else>{{ t(titleKey) }}</span>
      </div>
      <div class="highlight-close" @click.stop="onTapClose">
        <svg-icon name="close" class="highlight-close-svg" 
          :color="iconColor"
        ></svg-icon>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">

.highlight-container {
  width: 100%;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: .3s;
  pointer-events: none;
}

.highlight-container_shown {
  opacity: 1;
  max-height: 300px;
  pointer-events: auto;
}

.highlight-box {
  display: flex;
  margin-block-end: 10px;
}

.highlight-tip {
  flex: 1;
  white-space: pre-wrap;
  line-height: 1.6;
}

.highlight-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: -4px;
  transition: .15s;
  cursor: pointer;
}

.highlight-close-svg {
  width: 24px;
  height: 24px;
}

@media(hover: hover) {
  .highlight-close:hover {
    opacity: .8;
  }
}


</style>