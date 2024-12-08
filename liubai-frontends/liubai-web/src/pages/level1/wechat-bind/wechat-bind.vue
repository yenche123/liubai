<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useWechatBind } from './tools/useWechatBind';

const { 
  wbData,
  onTapBtn1,
  onTapBtn2,
} = useWechatBind()

const { t } = useI18n()

</script>
<template>
  <div class="liu-simple-page">

    <div class="liu-mc-container">

      <PlaceholderView :p-state="wbData.pageState"></PlaceholderView>

      <div v-show="wbData.pageState < 0" 
        class="liu-no-user-select liu-mc-box"
      >

        <div class="ap-icon-box">
          <svg-icon v-if="wbData.status === 'bound' || wbData.status === 'logged'"
            name="emojis-clapping_hands_color_default" 
            class="ap-icon"
            :cover-fill-stroke="false"
          ></svg-icon>
          <div class="ap-div-icon"></div>
        </div>

        <div class="ap-title">
          <span v-if="wbData.status === 'bound'">{{ t('login.bound') }}</span>
          <span v-else-if="wbData.status === 'logged'">{{ t('login.logged') }}</span>
          <spam v-else>{{ t('hello.appName') }}</spam>
        </div>

        <div class="ap-btn-container">

          <!-- Main Button -->
          <custom-btn class="ap-btn ap-ok-btn" @click="onTapBtn1">
            <span v-if="wbData.status === 'logout'">{{ t('login.wechat_one_login') }}</span>
            <span v-else-if="wbData.status === 'waiting'">{{ t('login.bind_wechat') }}</span>
            <span v-else>{{ t('common.back') }}</span>
          </custom-btn>

          <!-- Secondary Button -->
          <custom-btn v-if="wbData.status === 'logout'" 
            type="pure" class="ap-btn" @click="onTapBtn2"
          >
            <span>{{ t('login.other_way') }}</span>
          </custom-btn>

        </div>

      </div>

    </div>

  </div>
</template>
<style scoped lang="scss">

.liu-mc-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  height: 100dvh;
}

.ap-icon-box {
  width: 100px;
  height: 100px;
  position: relative;
  margin-block-end: min(10%, 50px);

  .ap-icon {
    width: 100%;
    height: 100%;
  }

  .ap-div-icon {
    width: 100px;
    height: 100px;
    background-image: url('/images/third-party/wechat.png');
    background-size: contain;
  }
}

.ap-title {
  width: 100%;
  text-align: center;
  font-size: var(--head-font);
  color: var(--main-normal);
  font-weight: 700;
  margin-block-end: min(10%, 50px);
}

.ap-btn-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
}

.ap-btn {
  max-width: var(--btn-max);
}

.ap-ok-btn {
  font-weight: 700;
  margin-block-end: 12px;
}

/** for wide screen */
@media screen and (min-width: 590px) {

  .ap-icon-box {
    margin-block-end: min(20%, 100px);
  }

  .ap-title {
    font-size: var(--big-word-style);
  }

  .ap-btn-container {
    position: relative;
    flex-direction: row-reverse;
    justify-content: space-around;
    bottom: 0;
  }

  .ap-btn {
    width: 40%;
    max-width: 300px;
  }

  .ap-ok-btn {
    margin-block-end: 0;
  }
}


</style>