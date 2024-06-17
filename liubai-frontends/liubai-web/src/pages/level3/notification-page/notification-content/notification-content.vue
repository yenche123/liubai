<script setup lang="ts">
import { useI18n } from "vue-i18n"
const { t } = useI18n()
</script>
<template>

  <div class="cc-box">
    <svg-icon 
      class="liu-no-user-select cc-img"
      :cover-fill-stroke="false"
      name="emojis-face_with_peeking_eye_color"
    ></svg-icon>
    <div class="cc-title">
      <span>{{ t('tip.coming_soon') }}</span>
    </div>
    <div class="cc-text">
      <span class="liu-selection">{{ t('tip.stay_tuned') }}</span>
    </div>
  </div>

</template>
<style scoped>

.cc-box {
  width: 60%;
  padding-inline: 20%;
  min-height: 85%;
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
}

.cc-title {
  text-align: center;
  margin-block-end: 10px;
  font-size: var(--head-font);
  font-weight: 700;
  color: var(--main-text);
}

.cc-text {
  text-align: center;
  line-height: 1.9;
  padding-block-end: min(15%, 75px);
  color: var(--main-text);
}

</style>