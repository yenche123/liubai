<script setup lang="ts">
import { ref } from 'vue';
import liuUtil from "~/utils/liu-util";
import { useI18n } from 'vue-i18n';
import { useCeToolbar } from './tools/useCeToolbar';
import type { CetEmit } from "./tools/types"
import { cetProps } from './tools/types';

const props = defineProps(cetProps)
const emit = defineEmits<CetEmit>()

const icon_color = "var(--main-normal)"
const selectImagesEl = ref<HTMLInputElement | null>(null)

const onImageChange = () => {
  const el = selectImagesEl.value
  if(!el) return
  if(!el.files || !el.files.length) return
  const files = liuUtil.getArrayFromFileList(el.files)
  emit("imagechange", files)
}

const { t } = useI18n()

const {
  expanded,
  showFormatClear,
  onTapExpand,
  onTapTag,
  onTapMore,
  onTapClearFormat,
} = useCeToolbar(props, emit)

</script>
<template>
  <!-- 第一排工具栏 -->
  <div class="ce-toolbar">
    <!-- 图片 -->
    <div class="liu-hover liu-hover_first cet-item" :aria-label="t('editor.image')">
      <input ref="selectImagesEl" 
        type="file" 
        :accept="liuUtil.getAcceptImgTypesString()" 
        class="ceti-input" 
        @change="onImageChange"
        title=""
        multiple
      />
      <svg-icon name="editor-image" class="ceti-icon" :color="icon_color" />
    </div>

    <!-- 标签 -->
    <div class="liu-hover cet-item"
      @click="onTapTag"
      :aria-label="t('editor.tag')"
    >
      <svg-icon name="tag" class="ceti-icon" :color="icon_color" />
    </div>

    <!-- 开启/关闭全屏 -->
    <div class="liu-hover cet-item"
      @click="onTapExpand"
      :aria-label="expanded ? t('editor.restore') : t('editor.expand')"
    >
      <svg-icon :name="expanded ? 'editor-cancel_fullscreen' : 'editor-open_fullscreen'" 
        :class="expanded ? 'ceti-close-fullscreen' : 'ceti-open-fullscreen'" :color="icon_color" />
    </div>

    <!-- 更多 -->
    <div class="liu-hover cet-item"
      :class="{ 'cet-item_selected': more }"
      @click="onTapMore"
      :aria-label="t('editor.more')"
    >
      <svg-icon name="more" class="ceti-icon ceti-more" 
        :class="{ 'ceti-more_open': more }"
        :color="icon_color"
      />
    </div>

    <!-- 清除样式 -->
    <div class="liu-hover cet-item cet-format-clear"
      :class="{ 'cet-format-clear_show': showFormatClear }"
      @click="onTapClearFormat"
      :aria-label="t('editor.format_clear')"
    >
      <svg-icon name="editor-format_clear" 
        class="ceti-icon" 
        :color="icon_color"
      />
    </div>

  </div>
</template>
<style scoped lang="scss">

.ce-toolbar {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  position: relative;

  .cet-item {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline-end: 4px;

    &:first-child {
      margin-inline-start: -8px;
    }

    .ceti-input {
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      position: absolute;
      opacity: 0;
      cursor: pointer;
      color: transparent;
    }
    
    .ceti-icon {
      width: 30px;
      height: 30px;
    }

    .ceti-open-fullscreen {
      width: 30px;
      height: 30px;
    }

    .ceti-close-fullscreen {
      width: 26px;
      height: 26px;
    }

    .ceti-expand {
      width: 26px;
      height: 26px;
    }

    .ceti-more {
      transition: .25s;
    }

    .ceti-more_open {
      transform: rotate(90deg);
    }
  }

  @media screen and (max-width: 380px)  {
    .cet-item {
      width: 40px;
      height: 40px;
      margin-inline-end: 4px;

      .ceti-icon {
        width: 28px;
        height: 28px;
      }
    }
    
  }

  .cet-item_selected {
    position: relative;
    overflow: hidden;
    
    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--primary-color);
      opacity: .12;
    }
  }

  .cet-format-clear {
    visibility: hidden;
    cursor: auto;
    transition: .15s;
    opacity: 0;
  }

  .cet-format-clear_show {
    visibility: visible;
    cursor: pointer;
    opacity: 1;
  }

}


</style>