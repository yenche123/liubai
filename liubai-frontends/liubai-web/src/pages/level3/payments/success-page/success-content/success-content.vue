<script setup lang="ts">
import { useI18n } from "vue-i18n"

const { t } = useI18n()

</script>
<template>

  <div class="cc-box">
    <svg-icon 
      class="cc-img"
      :cover-fill-stroke="false"
      name="emojis-smiling_face_with_heart-eyes_color"
    ></svg-icon>
    <div class="cc-text">
      <span class="liu-selection">{{ t('payment.success_title') }}</span>
    </div>
  </div>

</template>
<style scoped>

.cc-box {
  width: 60%;
  padding-inline: 20%;
  height: 85%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.cc-img {
  width: 100px;
  height: 100px;
  margin-block-end: min(20%, 100px);
  user-select: none;
}

.cc-text {
  text-align: center;
  line-height: 1.9;
  padding-block-end: min(15%, 75px);
  color: var(--main-text);
}

</style>