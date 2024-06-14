<script setup lang="ts">
import { ref } from "vue"
import liuApi from "~/utils/liu-api"
import { useI18n } from "vue-i18n";

const enable = ref(false)
const res = liuApi.canIUse.isSafeBrowser()
if(!res) {
  enable.value = true
}

const { t } = useI18n()

</script>
<template>

  <div v-if="enable" class="td-container">

    <div class="td-box">
      <div class="td-title">
        <span>{{ t('tip.browser_not_supported_1') }}</span>
      </div>

      <div class="td-desc">
        <span>{{ t('tip.browser_not_supported_2') }}</span>
      </div>

    </div>
  </div>



</template>
<style scoped lang="scss">

.td-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  z-index: 5000;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, .75);
    z-index: -1;
  }

}

.td-box {
  width: 92%;
  max-width: var(--standard-max-px);
  box-sizing: border-box;
  padding: 28px 6% 28px;
  border-radius: 10px;
  text-align: center;
  position: relative;
  background: rgba(255, 255, 255, .97);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.td-title {
  font-size: var(--title-font);
  font-weight: 700;
  color: #1f2429;
}

.td-desc {
  font-size: var(--desc-font);
  color: #1f2429;
  line-height: 1.5;
  text-wrap: balance;
  margin-block-start: 20px;
  margin-block-end: 20px;
}

</style>