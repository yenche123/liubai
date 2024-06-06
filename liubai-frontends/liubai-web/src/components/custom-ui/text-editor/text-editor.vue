<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { initTextEditor } from "./tools/useTextEditor";

const { t } = useI18n()

const {
  enable: teEnable,
  show: teShow,
  teData,
  onTapConfirm: onTapTeConfirm,
  onTapCancel: onTapTeCancel,
  onInput,
  inputEl: textEditorInputEl,
  canSubmit: canTextEditorSubmit,
  TRANSITION_DURATION: modalTranMs,
} = initTextEditor()

</script>
<template>

  <div 
    v-if="teEnable" 
    class="cui-modal-container" 
    :class="{ 'cui-modal-container_show': teShow }"
  >
    <div class="cui-modal-bg"></div>
    <div class="cui-modal-box">
      <h1 v-if="teData.title">{{ teData.title }}</h1>
      <h1 v-else-if="teData.title_key">{{ t(teData.title_key) }}</h1>
      <input class="cui-text-editor-input ph-no-capture" 
        v-model="teData.inputTxt" 
        ref="textEditorInputEl" 
        :placeholder="teData.placeholder ? teData.placeholder: teData.placeholder_key ? 
          t(teData.placeholder_key) : t('cui.plz_input_txt')"
        :maxlength="teData.maxLength"
        autocomplete="nope"
        @input="onInput"
        data-clarity-mask="true"
        data-bf-ignore-keypress
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


</template>
<style scoped lang="scss">

.cui-modal-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
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
      -webkit-backdrop-filter: blur(2px);
      backdrop-filter: blur(2px);
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

    .cui-modal-btns {
      width: 100%;
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      position: relative;

      @media(hover: hover) {
        .cui-modal-btn:hover {
          background-color: var(--cui-modal-other-btn-hover);
        }

        .cui-modal-confirm:hover {
          background-color: var(--primary-hover);
        }

        .cui-btn_disabled:hover {
          background-color: var(--primary-color);
        }
      }

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

        &:active {
          background-color: var(--cui-modal-other-btn-hover);
        }
      }

      .cui-modal-confirm {
        color: var(--on-primary);
        background-color: var(--primary-color);

        &:active {
          background-color: var(--primary-active);
        }
      }

      .cui-btn_disabled {
        opacity: .6;
        cursor: auto;

        &:active {
          background-color: var(--primary-color);
        }
      }

    }
  }

}

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



</style>