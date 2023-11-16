<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useOAuthPage } from './tools/useOAuthPage';
import PulsarLoader from '~/components/loaders/pulsar-loader/pulsar-loader.vue';

const { opData, onTapBack } = useOAuthPage()
const { t } = useI18n()

</script>
<template>
  <!-- 顶部: 返回导航栏 -->
  <div class="lp-navi-bar">


    <div class="lpn-box">

      <!-- 返回按钮 -->
      <div class="liu-hover lpn-back" @click.stop="onTapBack">
        <div class="lpn-back-icon">
          <svg-icon name="arrow-back700" class="lpn-back-svg" color="var(--main-normal)"></svg-icon>
        </div>
        <span>{{ t('common.back') }}</span>
      </div>

    </div>

  </div>

  <!-- 主体 -->
  <div class="lp-body">
    <!-- 顶部占位 -->
    <div class="lp-virtual"></div>

    <!-- 1. 登录中 -->
    <div v-if="opData.showLoading" class="lp-container">

      <div class="lpc-title">
        <span class="liu-selection">{{ t('login.logging') }}</span>
      </div>
      <PulsarLoader color="var(--main-normal)"></PulsarLoader>

    </div>


    <!-- 底部占位，形成上下对称 -->
    <div class="lp-virtual"></div>
  </div>


</template>
<style scoped lang="scss">

.lp-navi-bar {
  width: 100%;
  height: 100px;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.lpn-box {
  height: 100%;
  width: 92%;
  max-width: 1500px;
  position: relative;
  display: flex;
  align-items: center;
}

.lpn-back {
  display: flex;
  align-items: center;
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
  padding: 4px 16px 4px 10px;
  user-select: none;
}

.lpn-back-icon {
  width: 34px;
  height: 34px;
  margin-inline-end: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  .lpn-back-svg {
    width: 24px;
    height: 24px;
  }
}

.lp-body {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  z-index: 50;
  background-color: var(--bg-color);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.lp-virtual {
  width: 100%;
  height: 100px;
}

.lp-container {
  position: relative;
  width: 92%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lpc-title {
  text-align: center;
  width: 100%;
  font-size: var(--head-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-block-end: 75px;
}



</style>