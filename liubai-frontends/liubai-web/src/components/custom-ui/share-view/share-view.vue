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

        <div class="liu-hover sv-app-item">
          <svg-icon name="logos-google-calendar" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
          <span>Google Calendar</span>
        </div>

        <div class="liu-hover sv-app-item">
          <svg-icon name="logos-outlook" :coverFillStroke="false"
            class="sv-app-item_svg"
          ></svg-icon>
          <span>Outlook</span>
        </div>
        
      </div>

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
  padding: 12px 20px 12px 24px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
}

.sv-app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  margin-inline-end: 6px;
  margin-block-end: 6px;
  padding: 12px;
  border-radius: 12px;
  overflow: hidden;
  font-size: var(--mini-font);
  color: var(--other-btn-text);
  user-select: none;

  .sv-app-item_svg {
    width: 42px;
    height: 42px;
    margin-block-end: 10px;
  }
}




</style>