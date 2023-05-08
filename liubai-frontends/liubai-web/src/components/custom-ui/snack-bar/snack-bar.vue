<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { initSnackBar } from "./index"

const { t } = useI18n()
const {
  enable,
  show,
  sbData,
  onTapAction,
  TRANSITION_DURATION,
} = initSnackBar()

</script>
<template>

  <div 
    v-if="enable"
    class="sb-container"
    :class="{ 'sb-container_show': show }"
  >
    <div class="sb-box">
      <div class="sb-main-box">

        <div v-if="sbData.dot_color" class="sb-dot"
          :style="{ backgroundColor: sbData.dot_color }"
        ></div>

        <div class="sb-text">
          <span v-if="sbData.text">{{ sbData.text }}</span>
          <span v-else-if="sbData.text_key">{{ t(sbData.text_key) }}</span>
        </div>
      </div>
      <div v-if="(sbData.action || sbData.action_key)" 
        class="sb-action"
        :style="{ 'color': sbData.action_color ? sbData.action_color : undefined }"
        @click="onTapAction"
      >
        <span v-if="sbData.action">{{ sbData.action }}</span>
        <span v-else>{{ t(sbData.action_key) }}</span>
      </div>
      <div v-else class="sb-virtual"></div>
    </div>
  </div>

</template>
<style scoped lang="scss">

/** 以移动端小于 500px 先写 class，最后再用媒体查询写其他情况 */

.sb-container {
  width: 100%;
  position: fixed;
  left: 0;
  bottom: 0;
  padding-bottom: 24px;
  display: flex;
  justify-content: center;
  will-change: transform;
  transform: translateY(100%);
  opacity: 0;
  transition: v-bind("TRANSITION_DURATION + 'ms'");
  z-index: 5600;
}

.sb-container_show {
  transform: translateY(0);
  opacity: 1;
}

.sb-box {
  width: calc(100% - 48px);
  min-width: 90vw;
  display: flex;
  align-items: center;
  background-color: var(--cui-snackbar);
  box-shadow: var(--cui-snackbar-shadow);
  border-radius: 6px;
  position: relative;
}

.sb-main-box {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  padding: 14px 8px 14px 16px;
  position: relative;
}

.sb-dot {
  margin-block-start: 5px;
  margin-inline-end: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  overflow: hidden;
  flex: none;
}

.sb-text {
  font-size: var(--mini-font);
  color: var(--on-cui-snackbar);
  line-height: 1.33;
  user-select: none;
  flex: 1;
}

.sb-action {
  padding: 14px 20px 14px 12px;
  font-size: var(--mini-font);
  color: var(--inverse-primary);
  line-height: 1.33;
  position: relative;
  transition: .12s;
  cursor: pointer;
  user-select: none;
}

.sb-action:hover {
  opacity: .66;
}

/** 当 sb-action 不存在时显示的占位 */
.sb-virtual {
  height: 8x;
  width: 8px;
}


@media screen and (min-width: 500px) {
  .sb-container {
    justify-content: flex-start;
    padding-left: 24px;
  }

  .sb-box {
    width: auto;
    min-width: max(20vw, 250px);
    max-width: max(45vw, 460px);
  }

}






</style>