<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useSettingContent } from "./tools/useSettingContent";
import cfg from "~/config"

const { t } = useI18n()

const {
  data,
  onTapTheme,
  onTapLanguage,
} = useSettingContent()

const iconColor = "var(--main-normal)"

</script>
<template>

  <div class="mc-container">
    <div class="mc-box">
      <div class="mc-spacing"></div>

      <!-- 个人偏好 -->
      <div class="sc-title">
        <span>{{ t('setting.preference') }}</span>
      </div>
      <div class="sc-box">
        <!-- 主题 -->
        <div class="liu-hover sc-bar" @click="onTapTheme">
          <div class="scb-hd">
            <span>{{ t('setting.theme') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-text">
              <span>{{ data.theme_txt }}</span>
            </div>
            <div class="scb-footer-icon">
              <svg-icon v-if="data.theme === 'light'"
                class="scbf-svg-icon" 
                name="theme-light_mode"
                :color="iconColor"
              ></svg-icon>
              <svg-icon v-else-if="data.theme === 'dark'"
                class="scbf-svg-icon" 
                name="theme-dark_mode"
                :color="iconColor"
              ></svg-icon>
              <svg-icon v-else
                class="scbf-svg-icon" 
                name="theme-system-theme"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- 语言 -->
        <div class="liu-hover sc-bar" @click="onTapLanguage">
          <div class="scb-hd">
            <span>{{ t('setting.language') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-text">
              <span>{{ data.language_txt }}</span>
            </div>
            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>

</template>
<style scoped lang="scss">

.mc-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  .mc-box {
    width: 90%;
    max-width: var(--card-max);
    min-width: var(--card-min);
    position: relative;

    .mc-spacing {
      width: 100%;
      height: 10px;
    }
  }
}

.sc-title {
  font-size: var(--head-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-block-end: 8px;
  user-select: none;
}

.sc-box {
  background-color: var(--card-bg);
  border-radius: 24px;
  position: relative;
  padding: 16px 10px 10px 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  margin-block-end: 24px;
}

.sc-bar {
  width: 100%;
  border-radius: 8px;
  position: relative;
  display: flex;
  box-sizing: border-box;
  margin-block-end: 6px;
  overflow: hidden;
  padding: 10px 10px;
  user-select: none;
}

.sc-bar::before {
  border-radius: 8px;
}

.scb-hd {
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
}

.scb-footer {
  flex: 1 0 100px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.scb-footer-text {
  font-size: var(--btn-font);
  color: var(--main-note);
  letter-spacing: 1px;
}

.scb-footer-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.scbf-svg-icon {
  width: 22px;
  height: 22px;
}

.scbf-back {
  width: 18px;
  height: 18px;
}


</style>