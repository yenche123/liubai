<template>
  <node-view-wrapper class="code-block">

    <!-- 编辑模式 -->
    <div v-if="editor.isEditable" class="cb-right-top">

      <div class="code-block-tip"
        v-if="!isMobile"
        :class="{ 
          'code-block-tip_hidden': !editor.isActive('codeBlock') || !editor.isFocused
        }"
      >
        <span>{{ t("editor.leave_codeBlock", { tip: leaveTip }) }}</span>
      </div>

      <select contenteditable="false" v-model="showLanguage">
        <option :value="null">
          Auto
        </option>
        <option disabled>
          —
        </option>
        <option v-for="(language, index) in languages" :value="language" :key="index">
          {{ language }}
        </option>
      </select>

    </div>

    <!-- 阅读模式 -->
    <div v-else class="cb-right-top_read">
      <div class="cbrt-tip">
        <span v-if="showLanguage">{{ showLanguage }}</span>
        <span v-else>Auto</span>
      </div>
      <div v-if="canInteract" class="cbrt-line" />
      <div v-if="canInteract"
        class="cbrt-btn" 
        :class="{ 'cbrt-btn_no_pointer': showCopied }"
        @click.stop="onTapCopyCode"
      >
        <svg-icon name="copy" color="#a0a0a0" class="cbrt-btn-svg"></svg-icon>
        <div class="cbrt-btn-text">
          <span>{{ t('editor.copy_code') }}</span>
        </div>

        <div class="cbrt-copied" :class="{ 'cbrt-copied_show': showCopied }">
          <svg-icon name="check" color="#a0a0a0" class="cbrt-btn-svg"></svg-icon>
          <div class="cbrt-btn-text">
            <span>{{ t('common.copied') }}</span>
          </div>
        </div>

      </div>
    </div>

    <pre><code><node-view-content /></code></pre>
  </node-view-wrapper>
</template>

<script lang="ts">
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import liuUtil from '~/utils/liu-util'
import { useI18n } from 'vue-i18n'
import { computed, ref, inject } from 'vue'
import { 
  showProgrammingLanguages,
  supportedToShow,
  showToSupported,
} from "~/utils/other/lowlight-related"
import type {
  CbcLang,
  CbcFragment,
} from "./tools/types"
import liuApi from '~/utils/liu-api'
import type { LiuTimeout } from '~/utils/basic/type-tool'
import { editorCanInteractKey } from "~/utils/provide-keys"

export default {
  components: {
    NodeViewWrapper,
    NodeViewContent,
  },

  props: nodeViewProps,

  setup(props) {
    const { t } = useI18n()
    const leaveTip = liuUtil.getHelpTip("Mod_Enter")
    const languages = showProgrammingLanguages()
    const { 
      isMobile,
      isSafari,
    } = liuApi.getCharacteristic()
    

    const selectedLanguage = computed(() => {
      const _lang = props.node.attrs.language as CbcLang
      if(!_lang) return _lang
      const lang = showToSupported(_lang)
      return lang
    })

    const showLanguage = computed({
      get: () => {
        const s = selectedLanguage.value
        if(!s) return s
        const s2 = supportedToShow(s)
        return s2
      },
      set: (lang: CbcLang) => {
        let language = showToSupported(lang)
        props.updateAttributes({ language })
      }
    })


    let copiedTimeout: LiuTimeout
    const showCopied = ref(false)
    const onTapCopyCode = () => {
      //@ts-ignore
      const c = liuUtil.toRawData(props.node.content) as CbcFragment
      const text = c?.content?.[0].text
      if(!text) return
      liuApi.copyToClipboard(text)
      showCopied.value = true
      if(copiedTimeout) clearInterval(copiedTimeout)
      copiedTimeout = setTimeout(() => {
        copiedTimeout = undefined
        showCopied.value = false
      }, 2000)
    }

    const canInteract = inject(editorCanInteractKey, ref(true))

    return { 
      t, 
      languages, 
      isMobile,
      isSafari,
      leaveTip, 
      selectedLanguage,
      showLanguage,
      onTapCopyCode,
      showCopied,
      canInteract,
    }
  },
}
</script>

<style lang="scss">
.code-block {
  position: relative;

  .cb-right-top {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: calc(100% - 1rem);
    display: flex;
    align-items: center;
    justify-content: flex-end;

    .code-block-tip {
      margin-inline-end: 10px;
      font-size: var(--mini-font);
      font-family: inherit;
      color: #686868;
      display: inline-block;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      max-width: 48%;
      transition: .15s;
      opacity: 1;
    }

    .code-block-tip_hidden {
      opacity: 0;
    }

    select {
      font-size: var(--btn-font);
      font-family: inherit;
      color: var(--main-text);
      margin: 0.1rem;
      border: 1px solid var(--line-default);
      border-radius: 0.3rem;
      padding: 0.1rem 0.4rem;
      background: var(--card-bg);
      accent-color: var(--main-text);
      cursor: pointer;
      appearance: v-bind("isSafari ? 'none' : 'auto'");

      &[disabled] {
        opacity: 0.8;
        cursor: auto;
      }
    }

  }

  .cb-right-top_read {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: calc(100% - 1rem);
    display: flex;
    align-items: center;
    justify-content: flex-end;

    .cbrt-tip {
      font-size: var(--mini-font);
      font-family: inherit;
      color: #606060;
      user-select: none;
      margin-inline-end: 12px;
    }

    .cbrt-line {
      width: 1px;
      height: 15px;
      background-color: #323232;
      margin-inline-end: 8px;
      font-size: var(--mini-font);
    }

    .cbrt-btn {
      display: flex;
      align-items: center;
      padding: 0 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: .15s;
      position: relative;

      &::after {
        position: absolute;
        top: -4px;
        right: -4px;
        left: -2px;
        bottom: -2px;
        content: "";
      }
    }

    .cbrt-btn_no_pointer {
      cursor: default;
    }

    @media(hover: hover) {
      .cbrt-btn:hover {
        background-color: #2f2f2f;
      }
    }

    .cbrt-btn:active {
      background-color: #383838;
    }

    .cbrt-btn-svg {
      width: 18px;
      height: 18px;
    }

    .cbrt-btn-text {
      margin-inline-start: 4px;
      color: #a0a0a0;
      font-size: var(--mini-font);
      user-select: none;
    }

    .cbrt-copied {
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--code-block-bg);
      opacity: 0;
      visibility: hidden;
      transition: .15s;
      will-change: opacity;
    }

    .cbrt-copied_show {
      visibility: visible;
      opacity: 1;
    }

  }

}

</style>
