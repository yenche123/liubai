<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import liuUtil from '~/utils/liu-util';
import type { ToolBarEmits } from "./tools/types"
import { toolbarProps } from './tools/types';
import { useFormatClear } from '../../tools/useFormatClear';
import { useTbInputElements } from './tools/useTbInputElements';
import { deviceChaKey } from "~/utils/provide-keys"
import { inject } from 'vue';

const props = defineProps(toolbarProps)
const emit = defineEmits<ToolBarEmits>()

const {
  showFormatClear,
  onTapClearFormat,
} = useFormatClear(props)

const {
  selectImagesEl,
  onImageChange,
  onTapImage,
  selectFileEl,
  onFileChange,
  onTapFile,
} = useTbInputElements(props, emit)

const icon_color = `var(--avatar-bg)`
const { t } = useI18n()

const onTapFinishBtn = () => {
  if(!props.canSubmit) return
  emit("tapfinish")
}

const cha = inject(deviceChaKey)

</script>
<template>
  <div class="cem-toolbar" :class="{ 'cem-toolbar_translateY': isToolbarTranslateY }">
    <div class="cemt-main" :class="{ 'cemt-main_show': !isToolbarTranslateY }">
      <!-- 图片 -->
      <div class="liu-hover liu-hover_first cemt-item" 
        :class="{ 'cemt-item_first_above': located === 'popup' }"
        style="margin-inline-start: -5px;" 
        :aria-label="t('editor.image')"
        @click.stop="onTapImage"
      >
        <input ref="selectImagesEl" 
          type="file" 
          :accept="liuUtil.getAcceptImgTypesString()" 
          class="cemt-input"
          @change="onImageChange" 
          title="" 
          multiple 
        />
        <svg-icon name="editor-image" :color="icon_color" class="cemti-icon"></svg-icon>
      </div>

      <!-- 文件 -->
      <div class="liu-hover cemt-item" :aria-label="t('editor.attachment')"
        :class="{ 'cemt-item_above': located === 'popup' }"
        @click.stop="onTapFile"
      >
        <input ref="selectFileEl" type="file" class="cemt-input" @change="onFileChange" title="" />
        <svg-icon name="attachment" :color="icon_color" class="cemti-icon"></svg-icon>
      </div>

      <!-- 清除样式 -->
      <div class="liu-hover cemt-item cemt-format-clear"
        :class="{ 
          'cemt-format-clear_show': showFormatClear,
          'cemt-item_above': located === 'popup'
        }"
        @click="onTapClearFormat"
        :aria-label="t('editor.format_clear')"
      >
        <svg-icon name="editor-format_clear" 
          class="cemti-icon" 
          :color="icon_color"
        />
      </div>

    </div>
    <div class="cemt-footer">

      <div class="liu-no-user-select cemtf-tip" v-if="cha?.isPC">
        <span>{{ liuUtil.getHelpTip('Mod_Enter') }}</span>
      </div>

      <!-- 完成 -->
      <div class="liu-no-user-select cemtf-submit-btn" 
        :class="{ 'cemtf-submit_disabled': !canSubmit }"
        v-show="showSubmitBtn"
        @click.stop="onTapFinishBtn"
      >
        <span v-if="commentId">{{ t('common.update') }}</span>
        <span v-else>{{ t('comment.submit1') }}</span>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>


.cem-toolbar {
  width: 100%;
  height: 38px;
  position: relative;
  display: flex;
  align-items: center;
  transition: .15s;
}

.cem-toolbar_translateY {
  pointer-events: none;

  /** 计算方式: 
    cem-editor(最小高度 + padding-block-start) + cem-bottom-two(高度) 
  = 38 + 3.7 + 6
  */
  margin-block-start: -47.7px;
}

.cemt-main {
  display: flex;
  flex: 1;
  transition: .2s;
  opacity: 0;
}

.cemt-main_show {
  opacity: 1;
}

.cemt-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-inline-end: 4px;
  cursor: pointer;

  .cemt-input {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    position: absolute;
    opacity: 0;
    visibility: hidden;
    color: transparent;
  }

  .cemti-icon {
    width: 24px;
    height: 24px;
    position: relative;
  }

}

.cemt-item_above[aria-label]::after {
  top: 0;
  margin-top: 0;
  transform: translateX(50%) translateY(-120%);
}

.cemt-item_first_above[aria-label]::after {
  top: 0;
  margin-top: 0;
  right: 100%;
  transform: translateX(100%) translateY(-120%);
}

.cemt-format-clear {
  visibility: hidden;
  cursor: auto;
  transition: .15s;
  opacity: 0;
}

.cemt-format-clear_show {
  visibility: visible;
  cursor: pointer;
  opacity: 1;
}


.cemt-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  pointer-events: auto;
}

.cemtf-tip {
  padding-inline-end: 10px;
  font-size: var(--mini-font);
  color: var(--main-tip);
}

.cemtf-submit-btn {
  padding: 0 16px;
  border-radius: 20px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  background-color: var(--primary-color);
  color: var(--on-primary);
  font-size: var(--mini-font);
  transition: .15s;
  font-weight: 500;
}

@media(hover: hover) {
  .cemtf-submit-btn:hover {
    background-color: var(--primary-hover);
  }
}

.cemtf-submit-btn:active {
  background-color: var(--primary-active);
}

.cemtf-submit_disabled {
  background-color: var(--primary-color);
  opacity: .5;
  cursor: default;
}

@media(hover: hover) {
  .cemtf-submit_disabled:hover {
    background-color: var(--primary-color);
  }
}

.cemtf-submit_disabled:active {
  background-color: var(--primary-color);
}

</style>