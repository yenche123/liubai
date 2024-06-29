<script setup lang="ts">
import { initShareView } from './index';
import { useI18n } from "vue-i18n";

const {
  TRANSITION_DURATION,
  enable,
  show,
  svData,
  onTapMask,
  onPublicChanged,
  onTapAllowComment,
  onTapIcs,
  onTapShareItem,
} = initShareView()


const { t } = useI18n()

const icon_color = `var(--main-normal)`

</script>
<template>

  <div v-if="enable" class="sv-container"
    :class="{ 'sv-container_show': show }"
  >

    <div class="sv-bg" @click="onTapMask"></div>
    <div class="sv-box">

      <!-- export -->
      <div class="liu-no-user-select sv-bar sv-hover"
        @click.stop="() => svData.openExport = !svData.openExport"
      >
        <div class="svb-icon-box">
          <svg-icon name="desc_600" class="svb-svg-icon"
            :color="icon_color"
          ></svg-icon>
        </div>

        <div class="svb-hd">
          <span>{{ t('share_related.export_to_file') }}</span>
        </div>

        <div class="svb-footer">
          <div class="svbf-arrow-box">
            <svg-icon name="arrow-right2" class="svbf-arrow-svg"
              :class="{ 'svbg-arrow-svg_rotated': svData.openExport }"
              :color="icon_color"
            ></svg-icon>
          </div>
        </div>
      </div>

      <div class="svb-box" :class="{ 'svb-box_expaned': svData.openExport }">

        <!-- export markdown file -->
        <div class="svb-bar sv-hover"
          @click.stop="() => onTapShareItem('markdown', 'file')"
        >
          <div class="liu-no-user-select svb-title">
            <span>{{ t('share_related.markdown_format') }}</span>
          </div>
          <div class="svb-footer">
            <div class="svbf-arrow-box">
              <svg-icon name="arrow-right2" class="svbf-arrow-svg2"
                :color="icon_color"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- export text file -->
        <div class="svb-bar sv-hover"
          @click.stop="() => onTapShareItem('text', 'file')"
        >
          <div class="liu-no-user-select svb-title">
            <span>{{ t('share_related.txt_format') }}</span>
          </div>
          <div class="svb-footer">
            <div class="svbf-arrow-box">
              <svg-icon name="arrow-right2" class="svbf-arrow-svg2"
                :color="icon_color"
              ></svg-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- copy -->
      <div class="liu-no-user-select sv-bar sv-hover"
        @click.stop="() => svData.openCopy = !svData.openCopy"
      >
        <div class="svb-icon-box">
          <svg-icon name="copy" class="svb-svg-icon"
            :color="icon_color"
          ></svg-icon>
        </div>

        <div class="svb-hd">
          <span>{{ t('share_related.copy_to_clipboard') }}</span>
        </div>

        <div class="svb-footer">
          <div class="svbf-arrow-box">
            <svg-icon name="arrow-right2" 
              class="svbf-arrow-svg"
              :class="{ 'svbg-arrow-svg_rotated': svData.openCopy }"
              :color="icon_color"
            ></svg-icon>
          </div>
        </div>
      </div>

      <div class="svb-box" :class="{ 'svb-box_expaned': svData.openCopy }">

        <!-- copy markdown format -->
        <div class="svb-bar sv-hover" 
          @click.stop="() => onTapShareItem('markdown', 'copy')"
        >
          <div class="liu-no-user-select svb-title">
            <span>{{ t('share_related.markdown_format') }}</span>
          </div>
          <div class="svb-footer">
            <div class="svbf-arrow-box">
              <svg-icon name="arrow-right2" class="svbf-arrow-svg2"
                :color="icon_color"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- copy txt format -->
        <div class="svb-bar sv-hover"
          @click.stop="() => onTapShareItem('text', 'copy')"
        >
          <div class="liu-no-user-select svb-title">
            <span>{{ t('share_related.txt_format') }}</span>
          </div>
          <div class="svb-footer">
            <div class="svbf-arrow-box">
              <svg-icon name="arrow-right2" class="svbf-arrow-svg2"
                :color="icon_color"
              ></svg-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- share to -->
      <div class="liu-no-user-select sv-bar" style="cursor: default;">
        <div class="svb-hd">
          <span>{{ t('share_related.share_to') }}</span>
        </div>
      </div>
      <!-- third-party apps' btns -->
      <div class="sv-apps">

        <a class="liu-no-user-select liu-hover sv-app-item" target="_blank" :href="svData.googleCalendarLink"
          title="Google Calendar"
        >
          <svg-icon name="logos-google-calendar" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
        </a>

        <a class="liu-no-user-select liu-hover sv-app-item" target="_blank" :href="svData.outlookLink"
          title="Outlook"
        >
          <svg-icon name="logos-outlook" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
        </a>

        <a v-if="svData.lineLink" 
          class="liu-no-user-select liu-hover sv-app-item" 
          target="_blank" 
          :href="svData.lineLink"
          title="LINE"
        >
          <svg-icon name="logos-line" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
        </a>

        <a 
          v-if="svData.icsLink"
          class="liu-no-user-select liu-hover sv-app-item"
          :href="svData.icsLink"
          :title="t('share_related.download_ics')"
          @click.stop.prevent="onTapIcs"
        >
          <svg-icon name="calendar" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
        </a>

        <a class="liu-no-user-select liu-hover sv-app-item" target="_blank" 
          :href="svData.twitterLink"
          title="Twitter"
        >
          <svg-icon name="logos-twitter" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
        </a>

        <a class="liu-no-user-select liu-hover sv-app-item" target="_blank" 
          v-if="svData.emailLink"
          :href="svData.emailLink"
          title="Email"
        >
          <svg-icon name="email" :coverFillStroke="false"
            class="sv-app-item_svg sv-app-item_email"
          ></svg-icon>
        </a>
        
      </div>

      <div class="sv-virtual"></div>

    </div>
  </div>


</template>
<style lang="scss" scoped>

.sv-container {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  opacity: 0;
  transition: v-bind("TRANSITION_DURATION + 'ms'");
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 4900;

  &.sv-container_show {
    opacity: 1;
  }

  .sv-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
    z-index: 4901;
  }
}


.sv-box {
  width: 90vw;
  max-width: 550px;
  border-radius: 24px;
  box-shadow: var(--card-shadow-2);
  position: relative;
  background-color: var(--card-bg);
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 4902;
}

.sv-box::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
}

.sv-bar {
  width: 100%;
  box-sizing: border-box;
  margin-block-start: 28px;
  padding-inline: 24px 20px;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
}

.svb-icon-box {
  width: 40px;
  height: 40px;
  margin-inline-start: -4px;
  margin-inline-end: 4px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;

  .svb-svg-icon {
    width: 28px;
    height: 28px;
  }
}

.svb-hd {
  width: 70%;
  line-height: 1.5;
  color: var(--main-normal);
  font-size: var(--title-font);
  font-weight: 700;
  transition: .15s;
}

.svb-hd_disabled {
  opacity: .5;
}

.svb-footer {
  flex: 1 0 auto;
  display: flex;
  justify-content: flex-end;
}

.svbf-arrow-box {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .svbf-arrow-svg {
    width: 20px;
    height: 20px;
    will-change: transform;
    transition: .2s;
  }

  .svbf-arrow-svg2 {
    width: 16px;
    height: 16px;
  }

  .svbg-arrow-svg_rotated {
    transform: rotate(90deg);
  }
}

.svb-box {
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  padding-inline: 24px 20px;
  max-height: 0;
  opacity: 0;
  transition: .2s;
  position: relative;

  &.svb-box_expaned {
    opacity: 1;
    max-height: 100px;
  }
}

.svb-bar {
  padding-inline-start: 40px;
  padding-block-start: 8px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.svb-title {
  width: 70%;
  line-height: 1.5;
  color: var(--main-normal);
  font-size: var(--desc-font);
  font-weight: 700;
  cursor: pointer;
}

.sv-apps {
  margin-inline-start: 24px;
  margin-inline-end: 20px;
  padding-block-start: 12px;
  width: calc(100% - 44px);
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
  scrollbar-color: var(--scrollbar-thumb) transparent;

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
  }
}

.sv-app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
  margin-inline-end: 6px;
  margin-block-end: 6px;
  padding: 12px;
  border-radius: 12px;
  font-size: var(--mini-font);
  color: var(--other-btn-text);
  flex: none;

  .sv-app-item_svg {
    width: 42px;
    height: 42px;
  }

  .sv-app-item_email {
    transform: translateY(10%) scale(1.08);
  }

  .sva-text {
    text-align: center;
    font-size: var(--mini-font);
    color: var(--other-btn-text);
    max-width: 90px;
  }
}

.sv-virtual {
  width: 100%;
  height: 12px;
}


@media screen and (max-width: 550px) {

  .svb-icon-box {
    width: 36px;
    height: 36px;

    .svb-svg-icon {
      width: 24px;
      height: 24px;
    }

  }

  .sv-app-item {
    min-width: 42px;
    padding: 10px;
    margin-inline-end: 4px;

    .sv-app-item_svg {
      width: 38px;
      height: 38px;
    }
  }
}

@media screen and (max-width: 430px) {
  .svb-hd {
    font-size: var(--desc-font);
  }

  .sv-app-item {
    padding: 8px;
    font-size: var(--state-font);
    min-width: 34px;

    .sv-app-item_svg {
      width: 34px;
      height: 34px;
    }

    .sva-text {
      font-size: var(--state-font);
      max-width: 80px;
    }
  }

  .svb-title {
    font-size: var(--comment-font);
  }
}

@media screen and (max-width: 390px) {
  .sv-bar {
    margin-block-start: 20px;
  }

  .svbf-arrow-box {
    width: 24px;
    height: 24px;
  
    .svbf-arrow-svg {
      width: 18px;
      height: 18px;
    }
  }

  .svb-bar {
    padding-inline-start: 36px;
    padding-block-start: 6px;
  }
}

@media screen and (max-width: 320px) {
  .sv-bar {
    padding-inline: 20px 16px;
  }

  .sv-apps {
    margin-inline-start: 20px;
    margin-inline-end: 16px;
    padding-block-start: 8px;
    width: calc(100% - 36px);
  }

  .svb-box {
    padding-inline: 20px 16px;
  }
}

.sv-hover {
  cursor: pointer;
}

@media(hover: hover) {
  .sv-hover {
    transition: opacity .15s;
  }

  .sv-hover:hover {
    opacity: .8;
  }
}



</style>