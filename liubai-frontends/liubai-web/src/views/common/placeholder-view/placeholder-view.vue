<script lang="ts" setup>
import { PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import PulsarLoader from '~/components/loaders/pulsar-loader/pulsar-loader.vue';
import { usePlaceholderView, TRANSITION_MS } from "./tools/usePlaceholderView"

const { t } = useI18n()

const props = defineProps({
  pState: {
    // -1: 不显示 
    // 0: loading      
    // 50: 404   
    // 51: 没有访问权限
    type: Number as PropType<-1 | 0 | 50 | 51>,
    default: -1
  },
  errTitle: {
    type: String,
    default: "",
  },
  errMsg: {
    type: String,
    default: "",
  },
  zIndex: {
    type: Number,
    default: 500,
  }
})

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
      <div class="pv-emoji-box">
        <svg-icon name="emojis-face_vomiting_color" 
          class="pv-emoji"
          :cover-fill-stroke="false"
        ></svg-icon>
      </div>
      <div class="pv-err-title">
        <span v-if="errTitle">{{ errTitle }}</span>
        <span v-else-if="pState === 51">{{ t('err.no_auth') }}</span>
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

  .pv-loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pv-err-box {
    display: flex;
    flex-direction: column;
    align-items: center;

    .pv-emoji-box {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30px;
      user-select: none;

      .pv-emoji {
        width: 80px;
        height: 80px;
      }
    }

    .pv-err-title {
      color: var(--main-normal);
      font-weight: 700;
      font-size: var(--title-font);
      line-height: 2;
      text-align: center;
      user-select: none;
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


</style>