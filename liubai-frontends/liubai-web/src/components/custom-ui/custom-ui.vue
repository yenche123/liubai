<script setup lang="ts">
import DatePicker from "./date-picker/date-picker.vue"
import PreviewImage from "./preview-image/preview-image.vue";
import { initModal } from "./modal"
import { initLoading } from "./loading"
import { initTextEditor } from "./text-editor";
import { useI18n } from "vue-i18n";

const { t } = useI18n()
const {
  enable: modalEnable,
  show: modalShow,
  modalData,
  onTapConfirm: onTapModalConfirm,
  onTapCancel: onTapModalCancel,
  TRANSITION_DURATION: modalTranMs,
} = initModal()

const {
  title: loadingTitle,
  mask: loadingMask,
  enable: loadingEnable,
  show: loadingShow,
  TRANSITION_DURATION: loadingTranMs,
} = initLoading()

const {
  enable: teEnable,
  show: teShow,
  teData,
  onTapConfirm: onTapTeConfirm,
  onTapCancel: onTapTeCancel,
  inputEl: textEditorInputEl,
  canSubmit: canTextEditorSubmit,
} = initTextEditor()

</script>
<template>

  <!-- 弹窗 -->
  <div 
    v-if="modalEnable" 
    class="cui-modal-container" 
    :class="{ 'cui-modal-container_show': modalShow }"
  >
    <div class="cui-modal-bg"></div>
    <div class="cui-modal-box">

      <h1 v-if="modalData.title">{{ modalData.title }}</h1>
      <h1 v-else-if="modalData.title_key">{{ t(modalData.title_key) }}</h1>

      <p v-if="modalData.content">{{ modalData.content }}</p>
      <p v-else-if="modalData.content_key">{{ t(modalData.content_key) }}</p>

      <div class="cui-modal-btns">
        <div 
          v-if="modalData.showCancel" 
          class="cui-modal-btn"
          @click="onTapModalCancel"
        >
          <span v-if="modalData.cancelText">{{ modalData.cancelText }}</span>
          <span v-else>{{ t('common.cancel') }}</span>
        </div>
        <div 
          class="cui-modal-btn cui-modal-confirm"
          @click="onTapModalConfirm"
        >
          <span v-if="modalData.confirmText">{{ modalData.confirmText }}</span>
          <span v-else>{{ t('common.confirm') }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 文字输入框 -->
  <div 
    v-if="teEnable" 
    class="cui-modal-container" 
    :class="{ 'cui-modal-container_show': teShow }"
  >
    <div class="cui-modal-bg"></div>
    <div class="cui-modal-box">
      <h1 v-if="teData.title">{{ teData.title }}</h1>
      <h1 v-else-if="teData.title_key">{{ t(teData.title_key) }}</h1>
      <input class="cui-text-editor-input" 
        v-model="teData.value" 
        ref="textEditorInputEl" 
        :placeholder="teData.placeholder ? teData.placeholder: teData.placeholder_key ? 
          t(teData.placeholder_key) : t('cui.plz_input_txt')"
        :maxlength="teData.maxLength"
      />
      <div class="cui-modal-btns">
        <div 
          class="cui-modal-btn"
          @click="onTapTeCancel"
        >
          <span>{{ t("common.cancel") }}</span>
        </div>
        <div 
          class="cui-modal-btn cui-modal-confirm"
          :class="{ 'cui-btn_disabled': !canTextEditorSubmit }"
          @click="onTapTeConfirm"
        >
          <span>{{ t("common.confirm") }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 加载 loading 框 -->
  <div
    v-if="loadingEnable"
    class="cui-loading-container"
    :class="{ 'cui-loading-container_show': loadingShow }"
  >
    <div class="cui-loading-box">
      <div class="cui-loading-pulsar"></div>
      <span v-if="loadingTitle" class="cui-loading-title">{{ loadingTitle }}</span>
    </div>
  </div>

  <!-- 日期选择器 -->
  <DatePicker></DatePicker>

  <!-- 预览图片 -->
  <PreviewImage></PreviewImage>

</template>

<style scoped lang="scss">

/** 弹窗 */
.cui-modal-container {
  width: 100%;
  height: 100vh;
  position: fixed;
  z-index: 5100;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: v-bind("modalTranMs + 'ms'");
  opacity: 0;
  user-select: none;

  &.cui-modal-container_show {
    opacity: 1;
  }

  .cui-modal-bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
    z-index: 5105;
  }

  .cui-modal-box {
    width: 92%;
    max-width: var(--standard-max-px);
    box-sizing: border-box;
    padding: 28px 6% 18px;
    border-radius: 10px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 5110;
    position: relative;
    overflow: hidden;

    &::before {
      background-color: var(--cui-modal);
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }

    h1 {
      font-size: var(--title-font);
      font-weight: 700;
      color: var(--main-text);
      line-height: 1.5;
      margin-bottom: 10px;
      margin-block-start: 0;
      margin-block-end: 20px;
      z-index: 5112;
    }

    p {
      font-size: var(--desc-font);
      color: var(--main-text);
      line-height: 1.5;
      margin-block-start: 0;
      margin-block-end: 30px;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      user-select: text;
      z-index: 5112;
    }

    .cui-modal-btns {
      width: 100%;
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      position: relative;

      .cui-modal-btn {
        padding: 10px 16px;
        border-radius: 24px;
        font-size: var(--btn-font);
        color: var(--other-btn-text);
        background-color: var(--cui-modal-other-btn-bg);
        transition: .15s;
        max-width: 45%;
        min-width: 30%;
        text-align: center;
        margin-bottom: 10px;
        cursor: pointer;

        &:hover, &:active {
          background-color: var(--cui-modal-other-btn-hover);
        }
      }

      .cui-modal-confirm {
        color: var(--on-primary);
        background-color: var(--primary-color);

        &:hover {
          background-color: var(--primary-hover);
        }

        &:active {
          background-color: var(--primary-active);
        }
      }
    }
  }

}

/** text-editor */
.cui-text-editor-input {
  font-size: var(--desc-font);
  color: var(--main-text);
  line-height: 1.5;
  margin-block-start: 0;
  margin-block-end: 20px;
  width: 100%;
  text-align: center;
  position: relative;

  &::-webkit-input-placeholder {
    color: var(--main-code);
  }

  &::selection {
    background-color: var(--select-bg);
  }
}

.cui-btn_disabled {
  opacity: .6;
  cursor: default;
}


/** 加载框 */
.cui-loading-container {
  width: 100%;
  height: 100vh;
  position: fixed;
  z-index: 5200;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: v-bind("loadingTranMs + 'ms'");
  opacity: 0;
  pointer-events: v-bind("loadingMask ? 'auto' : 'none'");

  &.cui-loading-container_show {
    opacity: 1;
  }

  .cui-loading-box {
    z-index: 5210;
    width: 45vw;
    height: 45vw;
    max-width: 160px;
    max-height: 160px;
    min-width: 120px;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    color: var(--on-cui-loading);
    position: relative;
    overflow: hidden;
    box-shadow: var(--cui-loading-shadow);

    &::before {
      background-color: var(--cui-loading);
      position: absolute;
      content: "";
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
    }

    /** 来自 https://uiball.com/loaders/ */
    .cui-loading-pulsar {
      --uib-size: 40px;
      --uib-speed: 1.5s;
      position: relative;
      height: var(--uib-size);
      width: var(--uib-size);
    }

    .cui-loading-pulsar::before,
    .cui-loading-pulsar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      border-radius: 50%;
      background-color: var(--on-cui-loading);
      animation: pulse var(--uib-speed) ease-in-out infinite;
      transform: scale(0);
    }

    .cui-loading-pulsar::after {
      animation-delay: calc(var(--uib-speed) / -2);
    }

    @keyframes pulse {
      0%,
      100% {
        transform: scale(0);
        opacity: 1;
      }
      50% {
        transform: scale(1);
        opacity: 0.25;
      }
    }

    .cui-loading-title {
      font-size: var(--mini-font);
      margin-top: 30px;
      max-width: 80%;
      display: inline-block;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      z-index: 5212;
      user-select: none;
    }

  }

}



</style>