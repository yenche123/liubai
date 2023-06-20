<script setup lang="ts">
import { initLoading } from "./index";
import { useI18n } from "vue-i18n";

const { t } = useI18n()
const {
  TRANSITION_DURATION: loadingTranMs,
  loData,
} = initLoading()

</script>
<template>

  <div
    v-if="loData.enable"
    class="cui-loading-container"
    :class="{ 'cui-loading-container_show': loData.show }"
  >
    <div class="cui-loading-box">
      <div class="cui-loading-pulsar"></div>
      <span v-if="loData.title" class="cui-loading-title">{{ loData.title }}</span>
      <span v-else-if="loData.title_key" class="cui-loading-title">{{ t(loData.title_key) }}</span>
    </div>
  </div>

</template>
<style scoped lang="scss">

.cui-loading-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  z-index: 5200;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: v-bind("loadingTranMs + 'ms'");
  opacity: 0;
  pointer-events: v-bind("loData.mask ? 'auto' : 'none'");

  &.cui-loading-container_show {
    opacity: 1;
  }

  .cui-loading-box {
    z-index: 5210;
    width: 45vw;
    height: 45vw;
    max-width: 160px;
    max-height: 160px;
    min-width: 120px;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    color: var(--on-cui-loading);
    position: relative;
    overflow: hidden;
    box-shadow: var(--cui-loading-shadow);

    &::before {
      background-color: var(--cui-loading);
      position: absolute;
      content: "";
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
    }

    /** 来自 https://uiball.com/loaders/ */
    .cui-loading-pulsar {
      --uib-size: 40px;
      --uib-speed: 1.5s;
      position: relative;
      height: var(--uib-size);
      width: var(--uib-size);
    }

    .cui-loading-pulsar::before,
    .cui-loading-pulsar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      border-radius: 50%;
      background-color: var(--on-cui-loading);
      animation: pulse var(--uib-speed) ease-in-out infinite;
      transform: scale(0);
    }

    .cui-loading-pulsar::after {
      animation-delay: calc(var(--uib-speed) / -2);
    }

    @keyframes pulse {
      0%,
      100% {
        transform: scale(0);
        opacity: 1;
      }
      50% {
        transform: scale(1);
        opacity: 0.25;
      }
    }

    .cui-loading-title {
      font-size: var(--mini-font);
      margin-top: 30px;
      max-width: 80%;
      display: inline-block;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      z-index: 5212;
      user-select: none;
    }

  }

}

</style>