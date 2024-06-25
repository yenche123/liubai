<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useOpenWithBrowser } from "./tools/useOpenWithBrowser"

const { 
  owbData,
  cha,
  onTapClose,
} = useOpenWithBrowser()

const { t } = useI18n()

</script>
<template>
  <div v-if="owbData.enable" class="owb-container"
    :class="{ 'owb-container_show': owbData.show }"
  >
    <div class="owb-triangle" :class="{ 'owb-triangle_pc': cha.isPC }"></div>
    <div class="owb-box">
      <div class="liu-hover owb-close-btn" @click.stop="onTapClose">
        <svg-icon name="close" class="owb-close-svg" 
          color="var(--main-note)"
        ></svg-icon>
      </div>
      <div class="liu-no-user-select owb-main">
        <div class="owb-bar">

          <!-- text: Open with browser -->
          <span v-if="cha.isPC">{{ t('tip.open_with_browser_1') }}</span>
          <span v-else>{{ t('tip.open_with_browser_3') }}</span>

          <!-- icon -->
          <svg-icon v-if="cha.isPC"
            name="thirds-wechat_desktop_browser" 
            class="owb-browser-icon"
            color="var(--on-cui-snackbar)"
          ></svg-icon>
          <div v-else class="owb-browser-icon_mobile"></div>
          
        </div>
        <div class="owb-bar">
          <span>{{ t('tip.open_with_browser_2') }}</span>
        </div>
      </div>
    </div>
  </div>

</template>
<style lang="scss" scoped>

.owb-container {
  position: fixed;
  top: 6px;
  right: 15px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 1000;
  transform: translateY(-120%);
  transition: .3s;
}

.owb-container_show {
  transform: translateY(0);
}

.owb-triangle {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 12px solid var(--cui-snackbar);
  margin-inline-end: 9px;
}

.owb-triangle_pc {
  margin-inline-end: 35px;
}

.owb-box {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px;
  padding-inline-start: 10px;
  border-radius: 10px;
  background-color: var(--cui-snackbar);
  margin-block-start: -3px;
  box-shadow: var(--cui-snackbar-shadow);
}

.owb-close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: 8px;

  .owb-close-svg {
    width: 24px;
    height: 24px;
  }
}

.owb-main {
  position: relative;
}

.owb-bar {
  font-size: var(--btn-font);
  color: var(--on-cui-snackbar);
  max-width: 250px;
}

.owb-browser-icon {
  vertical-align: sub;
  display: inline-block;
  margin-inline-start: 5px;
  width: 18px;
  height: 18px;
}

.owb-browser-icon_mobile {
  vertical-align: sub;
  display: inline-block;
  margin-inline-start: 6px;
  width: 20px;
  height: 20px;
  background-image: url('/images/third-party/wechat_mobile_browser.png');
  background-size: contain;
}

.liu-hover::before {
  background-color: var(--on-primary);
}

</style>