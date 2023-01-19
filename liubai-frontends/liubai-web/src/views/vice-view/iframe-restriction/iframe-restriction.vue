<script setup lang="ts">
import type { PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VcState } from "../vice-content/tools/types"
import { useIframeRestriction } from './tools/useIframeRestriction';

const props = defineProps({
  viceViewPx: {
    type: Number,
    required: true
  },
  vcState: {
    type: String as PropType<VcState>,
    default: "",
  }
})

const {
  enable,
  show,
  irPx,
  onTapConfirm,
} = useIframeRestriction(props)

const { t } = useI18n()


</script>
<template>

  <div v-if="enable" class="ir-container"
    :class="{ 'ir-container_show': show }"
  >

    <div class="ir-box">

      <!-- 来一个哭脸 -->
      <div class="ir-emoji-box">
        <svg-icon 
          class="ir-emoji"
          :cover-fill-stroke="false"
          name="emojis-crying_face_color"
        ></svg-icon>
      </div>

      <!-- title -->
      <div class="ir-title">
        <span>{{ t('tip.ir_title') }}</span>
      </div>

      <!-- 内容 -->
      <div class="ir-content">
        <span>{{ t('tip.ir_content_1') }}</span>
        <svg-icon name="open_in_new" class="ir-open-in-new"></svg-icon>
        <span>{{ t('tip.ir_content_2') }}</span>
      </div>

      <!-- 我知道了 -->
      <div class="ir-got-it" @click="onTapConfirm">
        <span>{{ t('tip.got_it') }}</span>
      </div>

    </div>

  </div>

</template>
<style scoped lang="scss">

.ir-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 600;
  opacity: 0;
  transition: .3s;
  background-color: var(--bg-color);

  .ir-box {
    width: v-bind("irPx + 'px'");
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: .3s;
    position: relative;
  }

}


.ir-emoji-box {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  user-select: none;

  .ir-emoji {
    width: 80px;
    height: 80px;
  }
}

.ir-title {
  color: var(--main-normal);
  font-weight: 700;
  font-size: var(--title-font);
  line-height: 2;
  text-align: center;
  user-select: none;
  max-width: 90%;
}

.ir-content {
  margin-block-start: 10px;
  color: var(--main-normal);
  font-size: var(--btn-font);
  line-height: 30px;
  text-align: center;
  max-width: 75%;
  vertical-align: baseline;

  span::selection {
    background-color: var(--main-tip);
  }

  .ir-open-in-new {
    width: 24px;
    height: 24px;
    margin-inline: 4px;
    vertical-align: text-bottom;
  }
}

.ir-got-it {
  margin-block-start: 24px;
  height: 50px;
  width: 180px;
  font-size: var(--btn-font);
  color: var(--card-bg);
  background-color: var(--main-text);
  transition: .15s;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
}

.ir-got-it:active {
  opacity: .66;
}

@media(hover: hover) {
  .ir-got-it:hover {
    opacity: .75;
  }
}


.ir-container_show {
  opacity: 1;
}



</style>