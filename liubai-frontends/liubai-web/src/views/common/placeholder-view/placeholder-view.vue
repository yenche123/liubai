<script lang="ts" setup>
import { pvProps } from "./tools/types"
import { useI18n } from 'vue-i18n';
import PulsarLoader from '~/components/loaders/pulsar-loader/pulsar-loader.vue';
import { usePlaceholderView, TRANSITION_MS } from "./tools/usePlaceholderView"

const { t } = useI18n()

const props = defineProps(pvProps)
const { enable, show } = usePlaceholderView(props)

</script>
<template>

<div v-if="enable" class="pv-shell">

  <div class="pv-container"
    :class="{ 'pv-container_hidden': !show }"
  >

    <div v-if="pState <= 0" class="pv-loading">
      <PulsarLoader color="var(--main-normal)"></PulsarLoader>
    </div>

    <div v-else-if="pState >= 50" class="pv-err-box">
      <div class="liu-no-user-select pv-emoji-box">
        <svg-icon 
          v-if="pState === 52"
          name="emojis-crying_face_color" 
          class="pv-emoji"
          :cover-fill-stroke="false"
        ></svg-icon>
        <svg-icon 
          v-else-if="pState === 53"
          name="emojis-face_with_peeking_eye_color" 
          class="pv-emoji"
          :cover-fill-stroke="false"
        ></svg-icon>
        <svg-icon
          v-else
          name="emojis-face_vomiting_color" 
          class="pv-emoji"
          :cover-fill-stroke="false"
        ></svg-icon>
      </div>
      <div class="liu-no-user-select pv-err-title">
        <span v-if="errTitle">{{ errTitle }}</span>
        <span v-else-if="pState === 51">{{ t('err.no_auth') }}</span>
        <span v-else-if="pState === 52">{{ t('err.network') }}</span>
        <span v-else-if="pState === 53">{{ t('err.backend_required') }}</span>
        <span v-else>{{ t('err.no_data') }}</span>
      </div>
      <div class="pv-err-msg" v-if="errMsg">
        <span>{{ errMsg }}</span>
      </div>
    </div>

  </div>

</div>

</template>
<style scoped lang="scss">

.pv-shell {
  width: 100%;
  height: 0px;
  position: relative;
  z-index: v-bind("zIndex");
}

.pv-container {
  width: 100%;
  height: calc(100vh - 80px);
  top: 0;
  left: 0;
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: v-bind("TRANSITION_MS + 'ms'");
  z-index: v-bind("zIndex");
  background-color: v-bind("bgColor");

  .pv-loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pv-err-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: relative;

    .pv-emoji-box {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30px;

      .pv-emoji {
        width: 80px;
        height: 80px;
      }
    }

    .pv-err-title {
      color: var(--main-normal);
      font-weight: 700;
      font-size: var(--title-font);
      line-height: 1.5;
      text-align: center;
      width: 75%;
    }

    .pv-err-msg {
      margin-top: 10px;
      color: var(--main-normal);
      font-size: var(--btn-font);
      line-height: 1.5;
      text-align: center;
    }

    
  }

}

.pv-container_hidden {
  opacity: 0;
}

@supports (height: calc(100dvh - 80px)) {

  .pv-container {
    height: calc(100dvh - 80px);
  }

}

</style>