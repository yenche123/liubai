<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n()

defineProps({
  zIndex: {
    type: Number,
    default: 500,
  },
  bgColor: {
    type: String,
    default: "var(--bg-color)",
  }
})

</script>
<template>

  <div class="ce-shell">
    <div class="liu-no-user-select ce-container">

      <div class="ce-emoji-box">
        <svg-icon name="emojis-bottle_with_popping_cork_color"
          class="ce-emoji"
          :coverFillStroke="true"
        ></svg-icon>
      </div>

      <div class="ce-title">{{ t('calendar.empty_1') }}</div>
      <div class="ce-msg">{{ t('calendar.empty_2') }}</div>

    </div>
  </div>

</template>
<style scoped lang="scss">

.ce-shell {
  width: 100%;
  height: 0px;
  position: relative;
  z-index: v-bind("zIndex");
}

.ce-container {
  width: 100%;
  height: calc(100vh - 80px);
  top: 0;
  left: 0;
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: v-bind("zIndex");
  background-color: v-bind("bgColor");
}

.ce-emoji-box {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-block-end: 30px;

  .ce-emoji {
    width: 80px;
    height: 80px;
  }
}

.ce-title {
  color: var(--main-normal);
  font-weight: 700;
  font-size: var(--title-font);
  line-height: 1.5;
  text-align: center;
  width: 75%;
}

.ce-msg {
  margin-block-start: 10px;
  color: var(--main-normal);
  font-size: var(--btn-font);
  line-height: 1.5;
  text-align: center;
}


</style>