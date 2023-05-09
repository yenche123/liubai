<script setup lang="ts">
import AppLink from '~/components/common/app-link/app-link.vue';
import { useI18n } from "vue-i18n";
import { usePrefix } from "~/hooks/useCommon";
import { useSettingContent } from "./tools/useSettingContent";
import { useWindowSize } from '~/hooks/useVueUse';
import cfg from '~/config';
import { computed } from 'vue';

const { t } = useI18n()
const { width: windowWidth } = useWindowSize()

// 判断屏幕尺寸，决定当前机型的图标
// 若小于等于 600px，显示成手机，否则显示成浏览器窗口
const deviceIcon = computed(() => {
  const w = windowWidth.value
  if(w <= cfg.max_mobile_breakpoint) return "devices-smartphone"
  return "devices-app-window"
})


const {
  data,
  onTapTheme,
  onTapLanguage,
  onTapTerms,
  onTapLogout,
} = useSettingContent()

// 主题字段 i18n 的 key
const themeTextKey = computed(() => {
  const theme = data.theme
  if(theme === "auto") return "setting.day_and_night"
  return `setting.${theme}`
})

const { prefix } = usePrefix()

const iconColor = "var(--main-normal)"

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-mc-box">
      <div class="liu-mc-spacing"></div>

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
              <span>{{ t(themeTextKey) }}</span>
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
              <svg-icon v-else-if="data.theme === 'auto'"
                class="scbf-svg-icon" 
                name="devices-auto-toggle"
                :color="iconColor"
              ></svg-icon>
              <!-- 最后情况: 跟随系统 -->
              <svg-icon v-else
                class="scbf-svg-icon" 
                :name="deviceIcon"
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
              <span v-if="data.language === 'system'">{{ t('setting.system') }}</span>
              <span v-else>{{ data.language_txt }}</span>
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


      <!-- 导入 & 导出 -->
      <div class="sc-title">
        <span>{{ t('setting.import_export') }}</span>
      </div>
      <div class="sc-box">
        <!-- 导入 -->
        <AppLink :to="prefix + 'import'">
          <div class="liu-hover sc-bar">
            <div class="scb-hd">
              <span>{{ t('setting.import') }}</span>
            </div>
            <div class="scb-footer">
              <div class="scb-footer-icon">
                <svg-icon class="scbf-svg-icon scbf-import"
                  name="arrow_outward"
                  :color="iconColor"
                ></svg-icon>
              </div>
            </div>
          </div>
        </AppLink>

        <!-- 导出 -->
        <AppLink :to="prefix + 'export'">
          <div class="liu-hover sc-bar">
            <div class="scb-hd">
              <span>{{ t('setting.export') }}</span>
            </div>
            <div class="scb-footer">
              <div class="scb-footer-icon">
                <svg-icon class="scbf-svg-icon"
                  name="arrow_outward"
                  :color="iconColor"
                ></svg-icon>
              </div>
            </div>
          </div>
        </AppLink>
        

      </div>

      <!-- 其他 -->
      <div class="sc-title">
        <span>{{ t('setting.other') }}</span>
      </div>
      <div class="sc-box">
        <!-- 条款 -->
        <div class="liu-hover sc-bar" @click="onTapTerms">
          <div class="scb-hd">
            <span>{{ t('setting.terms') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                :class="{ 'scbfb_rotated': data.openTerms }"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>
        <!-- 条款们 -->
        <div class="sc-terms" :class="{ 'sc-terms_opened': data.openTerms }">
          <div class="sc-terms-box" :class="{ 'sc-terms-box_opened': data.openTerms }">
            <template v-for="(item, index) in data.termsList"
              :key="item.text"
            >
              <a :href="item.link" target="_blank" class="liu-hover sc-terms-item">
                <div class="sc-terms-title">
                  <span>{{ item.text }}</span>
                </div>
                <div class="sc-terms-icon">
                  <svg-icon class="scti-back"
                    name="arrow-right2"
                  ></svg-icon>
                </div>
              </a>
            </template>
          </div>
        </div>

        <!-- 退出 -->
        <div class="liu-hover sc-bar" @click="onTapLogout">
          <div class="scb-hd">
            <span>{{ t('setting.logout') }}</span>
          </div>
          <div class="scb-footer">
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

.sc-title {
  font-size: var(--title-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-inline-start: 10px;
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
  margin-block-end: 32px;
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

.scbf-import {
  transform: rotate(180deg);
}

.scbf-back {
  width: 18px;
  height: 18px;
  transition: .3s;
}

.scbfb_rotated {
  transform: rotate(90deg);
}

.sc-terms {
  width: 100%;
  position: relative;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: .3s;
}

.sc-terms_opened {
  max-height: 200px;
  opacity: 1;
}

.sc-terms-box {
  position: relative;
  width: 100%;
  transform: translateY(-50%);
  transition: .3s;
}

.sc-terms-box_opened {
  transform: translateY(0);
}

.sc-terms-item {
  width: 100%;
  border-radius: 8px;
  position: relative;
  display: flex;
  box-sizing: border-box;
  margin-block-end: 4px;
  overflow: hidden;
  padding: 7px 10px;
  user-select: none;
}

.sc-terms-title {
  font-size: var(--btn-font);
  color: var(--main-normal);
  font-weight: 700;
  flex: 1;
}

.sc-terms-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .scti-back {
    width: 16px;
    height: 16px;
  }
}



</style>
<style>

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root) {
  z-index: 9999;
}

::view-transition-new(root) {
  z-index: 1;
}

.liu-dark::view-transition-old(root) {
  z-index: 1;
}

.liu-dark::view-transition-new(root) {
  z-index: 9999;
}

</style>