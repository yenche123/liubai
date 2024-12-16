<script setup lang="ts">
import AppLink from '~/components/common/app-link/app-link.vue';
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import { useI18n } from "vue-i18n";
import { useSettingContent } from "./tools/useSettingContent";
import { useWindowSize } from '~/hooks/useVueUse';
import cfg from '~/config';
import { computed } from 'vue';

const { t } = useI18n()
const { width: windowWidth } = useWindowSize()

// 判断屏幕尺寸，决定当前机型的图标
// 若小于等于 650px，显示成手机，否则显示成浏览器窗口
const deviceIcon = computed(() => {
  const w = windowWidth.value
  if(w <= cfg.breakpoint_max_size.mobile) return "devices-smartphone"
  return "devices-app-window"
})


const {
  myProfile,
  prefix,
  data,
  onTapTheme,
  onTapLanguage,
  onTapFontSize,
  onTapTerms,
  onTapLogout,
  onTapDebug,
  onToggleMobileDebug,
  onTapClearCache,
  onTapNickname,
  onTapVersionUpdate,
  onTapA2HS,
  version,
  appName,
} = useSettingContent()

// 主题字段 i18n 的 key
const themeTextKey = computed(() => {
  const theme = data.theme
  if(theme === "auto") return "setting.day_and_night"
  return `setting.${theme}`
})

const fsTextKey = computed(() => {
  const fontSize = data.fontSize
  if(fontSize === "L") return "setting.font_large"
  return "setting.font_medium"
})

const iconColor = "var(--main-normal)"

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-mc-box">
      <div class="liu-mc-spacing"></div>
      
      <!-- profile + membership + accounts -->
      <div class="sc-box" v-if="data.hasBackend">

        <!-- avatar + nickname -->
        <div class="sc-avatar-nickname" v-if="myProfile">
          <div class="liu-hover sc-avatar-box">
            <LiuAvatar 
              :member-show="myProfile" 
              class="sc-avatar"
            ></LiuAvatar>
          </div>
          <div class="liu-no-user-select liu-hover sc-nickname-box"
            @click.stop="onTapNickname"
          >
            <div class="sc-nickname">
              <span v-if="myProfile.name">{{ myProfile.name }}</span>
              <span v-else>{{ t('common.unknown') }}</span>
            </div>
            <div class="scb-footer-icon sc-nickname-arrow">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- membership -->
        <AppLink to="/subscription">
          <div class="liu-no-user-select liu-hover sc-bar">
            <div class="scb-hd">
              <span>{{ t('setting.membership') }}</span>
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
        </AppLink>

        <!-- accounts -->
        <AppLink to="/accounts">
          <div class="liu-no-user-select liu-hover sc-bar">
            <div class="scb-hd">
              <span>{{ t('setting.accounts') }}</span>
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
        </AppLink>

      </div>

      <!-- preference -->
      <div class="liu-no-user-select sc-title">
        <span>{{ t('setting.preference') }}</span>
      </div>
      <div class="sc-box">
        <!-- theme -->
        <div class="liu-no-user-select liu-hover sc-bar" 
          @click.stop="onTapTheme"
        >
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

        <!-- language -->
        <div class="liu-no-user-select liu-hover sc-bar" 
          @click.stop="onTapLanguage"
        >
          <div class="scb-hd">
            <span>{{ t('setting.language') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-text">
              <span v-if="data.language === 'system'">{{ t('setting.system') }}</span>
              <span v-else>{{ data.language_txt }}</span>
            </div>
            <div class="scb-footer-icon">
              <svg-icon class="scbf-svg-icon"
                name="translate"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- font size -->
        <div class="liu-no-user-select liu-hover sc-bar" 
          @click.stop="onTapFontSize"
        >
          <div class="scb-hd">
            <span>{{ t('setting.font_size') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-text">
              <span>{{ t(fsTextKey) }}</span>
            </div>
            <div class="scb-footer-icon">
              <svg-icon v-if="data.fontSize === 'M'"
                class="scbf-svg-icon" 
                name="cup_medium"
                :color="iconColor"
              ></svg-icon>
              <svg-icon v-else
                class="scbf-svg-icon" 
                name="cup_large"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>


      </div>


      <!-- 导入 & 导出 -->
      <div class="liu-no-user-select sc-title">
        <span>{{ t('setting.import_export') }}</span>
      </div>
      <div class="sc-box">
        <!-- 导入 -->
        <AppLink :to="prefix + 'import'">
          <div class="liu-no-user-select liu-hover sc-bar">
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
          <div class="liu-no-user-select liu-hover sc-bar">
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
      <div class="liu-no-user-select sc-title">
        <span>{{ t('setting.other') }}</span>
      </div>
      <div class="sc-box">
        <!-- 条款 -->
        <!-- <div class="liu-no-user-select liu-hover sc-bar" 
          @click.stop="onTapTerms"
        >
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
        </div> -->
        <!-- 条款们 -->
        <!-- <div class="sc-pad" :class="{ 'sc-pad_opened': data.openTerms }">
          <div class="sc-pad-box" :class="{ 'sc-pad-box_opened': data.openTerms }">
            <template v-for="(item, index) in data.termsList"
              :key="item.text"
            >
              <a :href="item.link" target="_blank" 
                class="liu-no-user-select liu-hover sc-pad-item"
              >
                <div class="sc-pad-title">
                  <span>{{ item.text }}</span>
                </div>
                <div class="sc-pad-icon">
                  <svg-icon class="scti-back"
                    name="arrow-right2"
                  ></svg-icon>
                </div>
              </a>
            </template>
          </div>
        </div> -->

        <!-- 开发调试 -->
        <div v-if="data.debugBtn" 
          class="liu-no-user-select liu-hover sc-bar" 
          @click.stop="onTapDebug"
        >
          <div class="scb-hd">
            <span>{{ t('setting.dev_debug') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                :class="{ 'scbfb_rotated': data.openDebug }"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- 调试们 -->
        <div v-if="data.debugBtn" class="sc-pad" :class="{ 'sc-pad_opened': data.openDebug }">
          <div class="sc-pad-box" :class="{ 'sc-pad-box_opened': data.openDebug }">

            <!-- 移动端调试 -->
            <div class="liu-no-user-select liu-hover sc-pad-item" 
              @click.stop="onToggleMobileDebug(!data.mobileDebug)"
            >
              <div class="sc-pad-title">
                <span>{{ t('setting.mobile_debug') }}</span>
              </div>
              <div class="sc-pad-footer">
                <liu-switch :checked="data.mobileDebug" 
                  @change="onToggleMobileDebug($event.checked)"
                ></liu-switch>
              </div>
            </div>

            <!-- 清除缓存 -->
            <div class="liu-no-user-select liu-hover sc-pad-item" 
              @click.stop="onTapClearCache"
            >
              <div class="sc-pad-title">
                <span>{{ t('setting.clear_cache') }}</span>
              </div>
              <div class="sc-pad-icon">
                <svg-icon class="scti-back"
                  name="arrow-right2"
                ></svg-icon>
              </div>
            </div>

            <!-- 版本更新 -->
            <div v-if="data.showA2HS" class="liu-no-user-select liu-hover sc-pad-item" 
              @click.stop="onTapVersionUpdate"
            >
              <div class="sc-pad-title">
                <span>{{ t('setting.detect_version') }}</span>
              </div>
              <div class="sc-pad-icon">
                <svg-icon class="scti-back"
                  name="arrow-right2"
                ></svg-icon>
              </div>
            </div>

          </div>
        </div>

        <!-- Add to Home Screen -->
        <div class="liu-no-user-select liu-hover sc-bar"
          v-if="data.showA2HS"
          @click.stop="onTapA2HS"
        >
          <div class="scb-hd">
            <span>{{ t('a2hs.title') }}</span>
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

        <!-- Version Update -->
        <div class="liu-no-user-select liu-hover sc-bar"
          v-else
          @click.stop="onTapVersionUpdate"
        >
          <div class="scb-hd">
            <span>{{ t('setting.detect_version') }}</span>
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
        

        <!-- Contact -->
        <a v-if="data.contactLink" class="liu-no-user-select liu-hover sc-bar" 
          :href="data.contactLink"
        >
          <div class="scb-hd">
            <span>{{ t('setting.contact_dev') }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </a>

        <!-- 退出 -->
        <div class="liu-no-user-select liu-hover sc-bar" 
          @click.stop="onTapLogout"
        >
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

    <div class="liu-no-user-select sc-footer">
      <span translate="no">Powered by {{appName}} @ {{ version }}</span>
    </div>

  </div>

</template>
<style scoped lang="scss">

.liu-mc-box {
  min-height: calc(100vh - 60px);
  min-height: calc(100dvh - 60px);
}

.sc-footer {
  width: 100%;
  padding-block-start: 10px;
  height: 50px;
  display: flex;
  justify-content: center;
  font-size: var(--mini-font);
  font-weight: 200;
  color: var(--main-note);
}


.sc-title {
  font-size: var(--desc-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-inline-start: 10px;
  margin-block-end: 8px;
}

.sc-box {
  background-color: var(--card-bg);
  border-radius: 24px;
  position: relative;
  padding: 16px 10px 12px 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  margin-block-end: 32px;
  container-type: inline-size;
  container-name: sc-box;
}

.sc-avatar-nickname {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-block-end: 6px;
}

.sc-avatar-box {
  flex: 1;
  margin-inline-end: 6px;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 10px 10px;
}

.sc-avatar {
  width: 48px;
  height: 48px;
}

.sc-nickname-box {
  flex: 3;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 10px 10px;
}

.sc-nickname {
  font-size: var(--btn-font);
  color: var(--main-note);
  letter-spacing: 1px;
}


.sc-bar {
  width: 100%;
  border-radius: 8px;
  position: relative;
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
  padding: 10px 10px;

  &::before {
    border-radius: 8px;
  }
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

.sc-pad {
  width: 100%;
  position: relative;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: .3s;
}

.sc-pad_opened {
  max-height: 200px;
  opacity: 1;
}

.sc-pad-box {
  position: relative;
  width: 100%;
  padding-block-end: 6px;
  transform: translateY(-50%);
  transition: .3s;
}

.sc-pad-box_opened {
  transform: translateY(0);
}

.sc-pad-item {
  width: 100%;
  border-radius: 8px;
  position: relative;
  display: flex;
  box-sizing: border-box;
  margin-block-end: 4px;
  overflow: hidden;
  padding: 7px 10px;
}

.sc-pad-title {
  font-size: var(--btn-font);
  color: var(--main-normal);
  font-weight: 700;
  flex: 2;
}

.sc-pad-icon {
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

.sc-pad-footer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

@media screen and (max-width: 550px) {
  .sc-avatar-nickname {
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }

  .sc-avatar-box {
    flex: initial;
    margin-inline-end: 0;
    margin-block-end: 6px;
    padding: 5px;
  }

  .sc-nickname-box {
    flex: initial;
    padding: 4px 6px 4px 10px;
    justify-content: flex-start;
    margin-block-end: 0px;
  }

  .sc-nickname {
    font-weight: 700;
    color: var(--main-text);
  }

  .sc-nickname-arrow {
    width: 20px;
    height: 20px;

    .scbf-back {
      width: 16px;
      height: 16px;
    }
  }
}

@container sc-box (max-width: 550px) {
  .sc-avatar-nickname {
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }

  .sc-avatar-box {
    flex: initial;
    margin-inline-end: 0;
    margin-block-end: 6px;
    padding: 5px;
  }

  .sc-nickname-box {
    flex: initial;
    padding: 4px 6px 4px 10px;
    justify-content: flex-start;
    margin-block-end: 0px;
  }

  .sc-nickname {
    font-weight: 700;
    color: var(--main-text);
  }

  .sc-nickname-arrow {
    width: 20px;
    height: 20px;

    .scbf-back {
      width: 16px;
      height: 16px;
    }
  }
}



</style>
<style>

.liu-switching-theme::view-transition-old(root),
.liu-switching-theme::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

.liu-switching-theme::view-transition-old(root) {
  z-index: 9999;
}

.liu-switching-theme::view-transition-new(root) {
  z-index: 1;
}

.liu-switching-theme.liu-dark::view-transition-old(root) {
  z-index: 1;
}

.liu-switching-theme.liu-dark::view-transition-new(root) {
  z-index: 9999;
}

</style>