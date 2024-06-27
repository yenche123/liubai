<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import liuApi from '~/utils/liu-api';
import A2hsFaq from "../a2hs-faq/a2hs-faq.vue";

const { t } = useI18n()

const cha = liuApi.getCharacteristic()

</script>
<template>

  <div class="a2hs-title">
    <span v-if="cha.isIPadOS" class="liu-selection">{{ t('a2hs.ipad_safari_1') }}</span>
    <span v-else class="liu-selection">{{ t('a2hs.mobile_safari_1') }}</span>
  </div>

  <div v-if="cha.isIPadOS" class="a2hs-img-1_ipad"></div>
  <div v-else class="a2hs-img-1"></div>


  <div class="a2hs-title">
    <span class="liu-selection">{{ t('a2hs.mobile_safari_2') }}</span>
  </div>
  <div class="a2hs-img-2"></div>

  <a2hs-faq></a2hs-faq>

</template>
<style lang="scss" scoped>

.a2hs-title {
  font-size: var(--desc-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-block-end: 10px;
}

.a2hs-img-1_ipad {
  margin-block-end: 50px;
  width: 256px;
  height: 59px;
  background-image: url('/images/a2hs-ipad-1.jpg');
  background-size: contain;
  border-radius: 10px;
}

.a2hs-img-1 {
  margin-block-end: 50px;
  width: 300px;
  height: 37px;
  background-image: url('/images/a2hs-mobile-1.jpg');
  background-size: contain;
  border-radius: 10px;
}

.a2hs-img-2 {
  width: 256px;
  height: 256px;
  background-image: url('/images/a2hs-mobile-2.jpg');
  background-size: contain;
  border-radius: 10px;
}

</style>