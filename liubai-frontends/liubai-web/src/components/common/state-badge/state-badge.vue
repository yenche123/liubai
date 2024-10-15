<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSystemStore } from '~/hooks/stores/useSystemStore';
import { type StateShow } from '~/types/types-content';

const props = defineProps({
  stateShow: {
    type: Object as PropType<StateShow>,
    required: true,
  }
})

defineEmits<{
  (evt: 'tapstate'): void
}>()

const systemStore = useSystemStore()
const { supported_theme: theme } = storeToRefs(systemStore)

const stateColor = computed(() => {
  const s = props.stateShow?.colorShow
  if (!s) return ""
  return s
})

const { t } = useI18n()

</script>
<template>
  <div class="state-badge-container" v-if="stateShow">

    <div class="tct-state-shadow" v-if="theme === 'dark'" :style="{
      'background-color': stateColor
    }"></div>

    <div class="liu-no-user-select tct-state-box" :style="{
      'color': stateColor,
    }" @click.stop="$emit('tapstate')">
      <div class="tctsb-bg" :style="{
        'background-color': stateColor
      }"></div>
      <span v-if="stateShow.text">{{ stateShow.text }}</span>
      <span v-else-if="stateShow.text_key">{{ t(stateShow.text_key) }}</span>
    </div>

  </div>
</template>
<style lang="scss" scoped>

.state-badge-container {
  position: relative;
  width: fit-content;
}

.tct-state-shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: .24;
  border-radius: 6px 30px 6px 30px;
  filter: blur(9px);
}

.tct-state-box {
  padding: 2px 8px;
  border-radius: 2px 10px 2px 10px;
  min-width: 40px;
  text-align: center;
  font-size: var(--state-font);
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: .15s;

  .tctsb-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: v-bind("theme === 'dark' ? '.11' : '.19'");
  }
}

@media(hover: hover) {

  .tct-state-box:hover {
    opacity: .8;
  }

}

</style>