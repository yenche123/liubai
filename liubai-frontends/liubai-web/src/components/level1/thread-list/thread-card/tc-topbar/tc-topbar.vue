<script setup lang="ts">
import { type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ThreadShow } from '~/types/types-content';
import { useTcTopbar } from './tools/useTcTopbar';
import type { TctEmits } from "./tools/types"

const props = defineProps({
  threadData: {
    type: Object as PropType<ThreadShow>,
    required: true
  }
})

const emit = defineEmits<TctEmits>()
const { t } = useI18n()
const { 
  td,
  showTopbar,
  stateColor,
  theme,
} = useTcTopbar(props)

const onTapState = () => {
  emit('newoperate', 'state')
}

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
        placement="bottom-end"
      >
        <svg-icon class="tct-local-svg" color="var(--main-tip)"
          name="cloud_off"
        ></svg-icon>
      </LiuTooltip>
    </div>

    <!-- 状态 -->
    <div class="tct-item-container" v-if="td.stateShow">

      <div class="tct-state-shadow"
        v-if="theme === 'dark'"
        :style="{
          'background-color': stateColor
        }"
      ></div>

      <div class="tct-state-box"
        :style="{ 
          'color': stateColor,
        }"
        @click.stop="onTapState"
      >
        <div class="tctsb-bg"
          :style="{
            'background-color': stateColor
          }"
        ></div>
        <span v-if="td.stateShow.text">{{ td.stateShow.text }}</span>
        <span v-else-if="td.stateShow.text_key">{{ t(td.stateShow.text_key) }}</span>
      </div>

    </div>
    
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
  margin-inline-start: 14px;
}

.tct-local-svg {
  width: 20px;
  height: 20px;
  outline: 0;
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
  user-select: none;
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