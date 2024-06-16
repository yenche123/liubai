<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n()

</script>
<template>

  <div class="a2hs-title">
    <span class="liu-selection">{{ t('a2hs.desktop_safari_1') }}</span>
  </div>
  <div class="a2hs-img-1"></div>


  <div class="a2hs-title">
    <span class="liu-selection">{{ t('a2hs.desktop_safari_2') }}</span>
  </div>
  <div class="a2hs-img-2"></div>

</template>
<style lang="scss" scoped>

.a2hs-title {
  font-size: var(--desc-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-block-end: 10px;
}

.a2hs-img-1 {
  margin-block-end: 50px;
  width: 143px;
  height: 43px;
  background-image: url('/images/a2hs-desktop-1.jpg');
  background-size: contain;
  border-radius: 10px;
}

.a2hs-img-2 {
  margin-block-end: 20px;
  width: 256px;
  height: 174px;
  background-image: url('/images/a2hs-desktop-2.jpg');
  background-size: contain;
  border-radius: 10px;
}

</style>