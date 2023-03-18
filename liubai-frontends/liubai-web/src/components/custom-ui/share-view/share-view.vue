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
} = initShareView()


const { t } = useI18n()

</script>
<template>

  <div v-if="enable" class="sv-container"
    :class="{ 'sv-container_show': show }"
  >

    <div class="sv-bg" @click="onTapMask"></div>
    <div class="sv-box">

      <!-- public share -->
      <div class="sv-bar"
        @click="onPublicChanged(!svData.public)"
      >
        <div class="svb-hd">
          <span>{{ t('share_related.public_share') }}</span>
        </div>

        <div class="svb-footer">
          <liu-switch :checked="svData.public"
            @change="onPublicChanged($event.checked)"
          ></liu-switch>
        </div>
      </div>


      <!-- allow comment -->
      <div class="sv-bar"
        :class="{ 'sv-bar_disabled': !svData.public }"
        @click="onTapAllowComment"
      >
        <div class="svb-hd"
          :class="{ 'svb-hd_disabled': !svData.public }"
        >
          <span>{{ t('share_related.allow_comment') }}</span>
        </div>

        <div class="svb-footer">
          <liu-switch :checked="svData.allowComment"
            :disabled="!svData.public"
            @change="onTapAllowComment"
          ></liu-switch>
        </div>
      </div>

      <!-- export to -->
      <div class="sv-bar" style="cursor: auto">
        <div class="svb-hd">
          <span>{{ t('share_related.export_to') }}</span>
        </div>
      </div>
      <!-- third-party apps' btns -->
      <div class="sv-apps">

        <a class="liu-hover sv-app-item" target="_blank" :href="svData.googleCalendarLink">
          <svg-icon name="logos-google-calendar" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
          <div class="sva-text">
            <span>Google Calendar</span>
          </div>
        </a>

        <a class="liu-hover sv-app-item" target="_blank" :href="svData.outlookLink">
          <svg-icon name="logos-outlook" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
          <div class="sva-text">
            <span>Outlook</span>
          </div>
        </a>

        <a 
          v-if="svData.icsLink"
          class="liu-hover sv-app-item"
          :href="svData.icsLink"
        >
          <svg-icon name="calendar" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
          <div class="sva-text">
            <span>{{ t('share_related.download_ics') }}</span>
          </div>
        </a>

        <a class="liu-hover sv-app-item" target="_blank" :href="svData.twitterLink">
          <svg-icon name="logos-twitter" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
          <div class="sva-text">
            <span>Twitter</span>
          </div>
        </a>

        <a class="liu-hover sv-app-item" target="_blank" :href="svData.facebookLink">
          <svg-icon name="logos-facebook" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
          <div class="sva-text">
            <span>Facebook</span>
          </div>
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
  user-select: none;
  cursor: pointer;
}

.sv-bar_disabled {
  cursor: auto;
}

.svb-hd {
  width: 65%;
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
  min-width: 90px;
  margin-inline-end: 6px;
  margin-block-end: 6px;
  padding: 12px;
  border-radius: 12px;
  overflow: hidden;
  font-size: var(--mini-font);
  color: var(--other-btn-text);
  user-select: none;
  flex: none;

  .sv-app-item_svg {
    width: 42px;
    height: 42px;
    margin-block-end: 10px;
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


@media screen and (max-width: 520px) {
  .sv-app-item {
    min-width: 75px;
    padding: 10px;
    margin-inline-end: 4px;
    margin-block-end: 4px;
  }
}

@media screen and (max-width: 430px) {
  .sv-app-item {
    min-width: 60px;
    padding: 8px;
    font-size: var(--state-font);

    .sv-app-item_svg {
      width: 38px;
      height: 38px;
      margin-block-end: 8px;
    }

    .sva-text {
      font-size: var(--state-font);
      max-width: 80px;
    }
  }
}

@media screen and (max-width: 365px) {
  .sv-bar {
    margin-block-start: 20px;
  }

  .svb-hd {
    font-size: var(--desc-font);
  }
}




</style>