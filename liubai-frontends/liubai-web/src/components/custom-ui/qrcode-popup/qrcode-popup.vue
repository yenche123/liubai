<script setup lang="ts">
import { initQRCodePopup } from "./tools/useQRCodePopup";
import { useQRCode } from "~/hooks/useVueUse"
import RingLoader from "~/components/loaders/ring-loader/ring-loader.vue";
import { useI18n } from "vue-i18n";
import liuApi from "~/utils/liu-api"

const {
  TRANSITION_DURATION,
  onTapMask,
  onImgLoaded,
  qpData,
} = initQRCodePopup()

const qrcode = useQRCode(() => qpData.qr_code)
const { t } = useI18n()
const cha = liuApi.getCharacteristic()

</script>
<template>

  <div v-if="qpData.enable" class="ba-container"
    :class="{ 'ba-container_show': qpData.show }"
  >
    <div class="ba-bg" @click.stop="onTapMask"></div>
    <div class="ba-box"
      :class="{ 'ba-box_show': qpData.show }"
    >

      <!-- qrcode -->
      <div class="ba-qrcode-box">


        <div v-if="qpData.pic_url" class="ba-qrcode">
          <img class="ba-qrcode-img" 
            :class="{ 'ba-qrcode-img_shown': !qpData.loading }"
            :src="qpData.pic_url" 
            @load="onImgLoaded" 
          />
        </div>

        <div v-else-if="qrcode && qpData.qr_code" class="ba-qrcode">
          <img class="ba-qrcode-img ba-qrcode-img_shown" :src="qrcode" />
        </div>

        <div v-show="qpData.loading" class="ba-loading-box">
          <RingLoader></RingLoader>
        </div>

        <div class="ba-logo-box"
          v-if="!qpData.pic_url"
          :class="{ 'ba-logo-box_shown': !qpData.loading }"
        >
          <img src="/logos/logo_32x32_v2.png" 
            class="liu-no-user-select ba-logo-img"
          />
        </div>

      </div>

      <div class="ba-virtual"></div>

      <!-- info box -->
      <div class="liu-no-user-select ba-info">
        <div class="ba-info-title">
          <span v-if="qpData.bindType === 'wx_gzh_scan'">{{ t('qrcode.wx_scan_login') }}</span>
          <span v-else>{{ t('qrcode.title') }}</span>
        </div>
        <div v-if="qpData.bindType === 'wx_gzh_scan'" class="ba-info-desc">
          <span v-if="cha.isMobile && cha.isWeChat">{{ t('qrcode.long_press_3') }}</span>
          <span v-else-if="cha.isMobile">{{ t('qrcode.scan_3') }}</span>
          <span v-else>{{ t('qrcode.scan_3') }}</span>
        </div>
        <div v-else-if="qpData.bindType === 'ww_qynb'" class="ba-info-desc">
          <span v-if="cha.isMobile && cha.isWeChat">{{ t('qrcode.long_press_1') }}</span>
          <span v-else-if="cha.isMobile">{{ t('qrcode.screenshot') }}</span>
          <span v-else>{{ t('qrcode.scan_1') }}</span>
        </div>
        <div v-else-if="qpData.bindType === 'wx_gzh'" class="ba-info-desc">
          <span v-if="cha.isMobile && cha.isWeChat">{{ t('qrcode.long_press_2') }}</span>
          <span v-else-if="cha.isMobile">{{ t('qrcode.screenshot') }}</span>
          <span v-else>{{ t('qrcode.scan_2') }}</span>
        </div>

      </div>

    </div>
  </div>

</template>
<style lang="scss" scoped>

.ba-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2600;
  opacity: 0;
  transition-duration: v-bind("TRANSITION_DURATION + 'ms'");

  .ba-bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: var(--frosted-glass-4);
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
  }
}

.ba-container_show {
  opacity: 1;
}


/** 以宽屏来布局 */
.ba-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
  padding: 48px;
  border-radius: 24px;
  overflow: hidden;
  background-color: var(--card-bg);
  transition-timing-function: cubic-bezier(0.17, 0.86, 0.45, 1);
  transition-duration: v-bind("TRANSITION_DURATION + 'ms'");
  transform: translateY(25%);
  position: relative;
  box-shadow: var(--cui-popup-shadow);
}

.ba-box_show {
  transform: translateY(0);
}

.ba-qrcode-box {
  width: 180px;
  height: 180px;
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ba-loading-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}


.ba-qrcode {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ba-qrcode-img {
  width: 90%;
  height: 90%;
  opacity: 0;
  transition: .3s;
}

.ba-qrcode-img_shown {
  opacity: 1;
}

.ba-logo-box {
  width: 16%;
  height: 16%;
  position: absolute;
  top: 42%;
  left: 42%;
  opacity: 0;
  transition: .3s;
  pointer-events: none;
}

.ba-logo-box_shown {
  opacity: 1;
}

.ba-logo-img {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.ba-virtual {
  width: 48px;
  height: 48px;
}

.ba-info {
  display: flex;
  flex-direction: column;
  width: 300px;
  position: relative;
}

.ba-info-title {
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
  padding-block-end: 12px;
  text-wrap: pretty;
}

.ba-info-desc {
  font-size: var(--btn-font);
  color: var(--main-code);
  line-height: 1.5;
  text-wrap: pretty;
}

@media screen and (max-width: 660px) {

  .ba-container {
    align-items: flex-end;
  }

  .ba-box {
    width: 100%;
    flex-direction: column;
    padding: 32px 24px 48px 24px;
    border-radius: 24px 24px 0 0;
    transform: translateY(90%);
  }

  .ba-box_show {
    transform: translateY(0);
  }

  .ba-virtual {
    height: 32px;
  }

  .ba-info {
    width: 100%;
  }

  .ba-info {
    align-items: center;

    div {
      text-align: center;
    }
  }
  
}

@media screen and (max-width: 720px) {
  .ba-virtual {
    width: 24px;
  }
}



</style>