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
  onAllowCommentChanged,
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
      <div class="sv-bar">
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
      <div class="sv-bar">
        <div class="svb-hd">
          <span>{{ t('share_related.allow_comment') }}</span>
        </div>

        <div class="svb-footer">
          <liu-switch :checked="svData.allowComment"
            @change="onAllowCommentChanged($event.checked)"
            :disabled="!svData.public"
          ></liu-switch>
        </div>
      </div>

      <!-- export to -->
      <div class="sv-bar">
        <div class="svb-hd">
          <span>{{ t('share_related.export_to') }}</span>
        </div>
      </div>
      <!-- third-party apps' btns -->
      <div class="sv-apps">
        
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
  }
}


.sv-box {
  width: 90vw;
  max-width: 550px;
  border-radius: 16px;
  box-shadow: var(--card-shadow-2);
  position: relative;
  background-color: var(--card-bg);
  overflow-x: hidden;
  overflow-y: auto;
}

.sv-box::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
}

.sv-bar {
  width: 100%;
  box-sizing: border-box;
  padding: 24px 20px 0px 24px;
  display: flex;
  align-items: center;
  position: relative;
}

.svb-hd {
  width: 65%;
  line-height: 1.5;
  color: var(--main-normal);
  font-size: var(--title-font);
  font-weight: 700;
}

.svb-footer {
  flex: 1 0 auto;
  display: flex;
  justify-content: flex-end;
}

.sv-apps {
  padding: 16px 20px 24px 24px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
}



</style>