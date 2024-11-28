<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useSuccessContent } from "./tools/useSuccessContent";

const { t } = useI18n()

const { 
  wStore,
  WECOM_GROUP_LINK,
  onTapView,
  onTapGroup,
} = useSuccessContent()

</script>
<template>

  <div class="cc-box">
    <svg-icon 
      class="liu-no-user-select cc-img"
      :cover-fill-stroke="false"
      name="emojis-smiling_face_with_heart-eyes_color"
    ></svg-icon>
    <div class="cc-text">
      <span class="liu-selection">{{ t('payment.success_title') }}</span>
    </div>
    <div class="cc-btn-box" v-if="wStore.userId">

      <custom-btn v-if="WECOM_GROUP_LINK" class="cc-btn" @click="onTapGroup">
        <span style="font-weight: 700;">{{ t('payment.go_to_group') }}</span>
      </custom-btn>

      <custom-btn class="cc-btn" @click="onTapView"
        :type="WECOM_GROUP_LINK ? 'pure' : 'main'"
      >
        <span v-if="WECOM_GROUP_LINK">{{ t('common.back') }}</span>
        <span v-else style="font-weight: 700;">{{ t('payment.check_out') }}</span>
      </custom-btn>
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
  flex: none;
  margin-block-end: 5vh;
  margin-block-end: 5dvh;
}

.cc-text {
  text-align: center;
  line-height: 1.9;
  font-size: var(--head-font);
  font-weight: 700;
  margin-block-end: 18vh;
  margin-block-end: 20dvh;
  color: var(--main-text);
}

.cc-btn-box {
  width: 100%;
  padding-block-end: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.cc-btn {
  max-width: var(--btn-max);
  margin-block-end: 12px;
}

</style>