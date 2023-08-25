<script setup lang="ts">
import { initHashtagSelector } from "./tools/useHashtagSelector"
import { useI18n } from "vue-i18n";

const {
  hsData,
  onTapCancel,
  onTapConfirm,
} = initHashtagSelector()

const { t } = useI18n()

</script>
<template>

  <div v-if="hsData.enable" class="hs-container"
    :class="{ 'hs-container_show': hsData.show }"
  >

    <div class="hs-bg"></div>

    <div class="hs-box">

      <!-- 取消、标题、确认 -->
      <div class="hs-bar">

        <custom-btn 
          type="other"
          size="mini"
          @click="onTapCancel"
        >
          <span>{{ t('common.cancel') }}</span>
        </custom-btn>

        <div class="hs-title">
          <span>{{ t('tag_related.edit_tag') }}</span>
        </div>

        <custom-btn 
          type="main"
          size="mini"
          :disabled="!hsData.canSubmit"
          @click="onTapConfirm"
        >
          <span>{{ t('common.confirm') }}</span>
        </custom-btn>

      </div>

      <!-- 输入框 -->
      <div class="hs-bar">

      </div>

    </div>


  </div>

</template>
<style scoped lang="scss">

.hs-container {
  position: fixed;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 5100;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;
  opacity: 0;
  transition: v-bind("hsData.transDuration + 'ms'");

  &.hs-container_show {
    opacity: 1;
  }

  .hs-bg {
    z-index: 5101;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
  }
}

.hs-box {
  z-index: 5102;
  margin-top: 20vh;
  margin-top: 20dvh;
  width: 90%;
  max-width: 500px;
  border-radius: 16px;
  box-shadow: var(--card-shadow-2);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--frosted-glass-2);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }
}


.hs-bar {
  width: 100%;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  position: relative;
}

.hs-title {
  flex: 1;
  display: flex;
  justify-content: center;
  font-size: var(--desc-font);
  font-weight: 700;
  color: var(--main-normal);
  user-select: none;
}

</style>