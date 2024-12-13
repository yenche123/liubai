<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAccountsContent } from './tools/useAccountsContent';

const {
  acData,
  onTapPhone,
  onTapWeChat,
  onTapEmail,
} = useAccountsContent()

const { t } = useI18n()

const iconColor = "var(--main-normal)"

</script>
<template>

  <PlaceholderView
    :p-state="acData.pageState"
  ></PlaceholderView>

  <div v-if="acData.pageState < 0" class="ac-container">

    <!-- Phone -->
    <div class="liu-no-user-select liu-hover ac-item" @click.stop="onTapPhone">

      <div class="ac-logo">
        <svg-icon name="emojis-mobile_phone_color"
          class="ac-logo-icon"
          :cover-fill-stroke="false"
        ></svg-icon>
      </div>

      <div class="aci-info">
        <div class="aci-hd">
          <span>{{ t('setting.phone') }}</span>
        </div>
        <div class="aci-bd" v-if="acData.phone_pixelated">
          <span>{{ acData.phone_pixelated }}</span>
        </div>
        <div class="aci-bd aci-bd_not_yet" v-else>
          <span>{{ t('setting.not_yet_bound') }}</span>
        </div>
      </div>

      <div class="aci-footer">
        <svg-icon name="arrow-right2" :color="iconColor"
          class="aci-footer-arrow"
        ></svg-icon>
      </div>

    </div>

    <!-- WeChat -->
    <div class="liu-no-user-select liu-hover ac-item" @click.stop="onTapWeChat">

      <div class="ac-logo">
        <div class="ac-logo-image ac-logo-wechat"></div>
      </div>

      <div class="aci-info">
        <div class="aci-hd">
          <span>{{ t('setting.wechat') }}</span>
        </div>
        <div class="aci-bd" v-if="acData.wx_gzh_openid">
          <span v-if="acData.wx_gzh_nickname">{{ acData.wx_gzh_nickname }}</span>
          <span v-else>{{ t('setting.bound') }}</span>
        </div>
        <div class="aci-bd aci-bd_not_yet" v-else>
          <span>{{ t('setting.not_yet_bound') }}</span>
        </div>
      </div>

      <div class="aci-footer">
        <svg-icon name="arrow-right2" :color="iconColor"
          class="aci-footer-arrow"
        ></svg-icon>
      </div>

    </div>


    <!-- Email -->
    <div class="liu-no-user-select liu-hover ac-item" @click.stop="onTapEmail">

      <div class="ac-logo">
        <svg-icon name="emojis-e_mail_color"
          class="ac-logo-icon"
          :cover-fill-stroke="false"
        ></svg-icon>
      </div>

      <div class="aci-info">
        <div class="aci-hd">
          <span>{{ t('setting.email') }}</span>
        </div>
        <div class="aci-bd" v-if="acData.email">
          <span>{{ acData.email }}</span>
        </div>
        <div class="aci-bd aci-bd_not_yet" v-else>
          <span>{{ t('setting.not_yet_bound') }}</span>
        </div>
      </div>

      <div class="aci-footer">
        <svg-icon name="arrow-right2" :color="iconColor"
          class="aci-footer-arrow"
        ></svg-icon>
      </div>

    </div>


  </div>

</template>
<style scoped lang="scss">

.ac-container {
  background-color: var(--card-bg);
  border-radius: 24px;
  position: relative;
  padding: 16px 10px 12px 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  margin-block-end: 32px;
  container-type: inline-size;
  container-name: ac-container;
}

.ac-item {
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

.ac-logo {
  width: 32px;
  height: 32px;
  margin-inline-end: 16px;
  position: relative;

  .ac-logo-icon {
    width: 100%;
    height: 100%;
  }

  .ac-logo-image {
    width: 100%;
    height: 100%;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }

  .ac-logo-wechat {
    background-image: url('/images/third-party/wechat.png');
  }
}

.aci-info {
  flex: 3;
  position: relative;
}

.aci-hd {
  font-size: var(--desc-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-block-end: 2px;
}

.aci-bd {
  font-size: var(--mini-font);
  color: var(--main-code);
}

.aci-bd_not_yet {
  color: var(--main-tip);
  font-style: italic;
}

.aci-footer {
  flex: 1;
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.aci-footer-arrow {
  width: 20px;
  height: 20px;
}





</style>