<template>
  <node-view-wrapper class="code-block">

    <!-- 编辑模式 -->
    <div v-if="editor.isEditable" class="cb-right-top">

      <div class="liu-no-user-select code-block-tip"
        v-if="!isMobile"
        :class="{ 
          'code-block-tip_hidden': !editor.isActive('codeBlock') || !editor.isFocused
        }"
      >
        <span>{{ t("editor.leave_codeBlock", { tip: leaveTip }) }}</span>
      </div>

      <select contenteditable="false" v-model="langDisplayed">
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

      <!-- Language, for example, TypeScript -->
      <div v-if="!showVisualize" class="liu-no-user-select cbrt-tip">
        <span v-if="langDisplayed">{{ langDisplayed }}</span>
        <span v-else>Auto</span>
      </div>
      <div v-if="!showVisualize && canInteract" class="cbrt-line" />

      <!-- Visualize -->
      <div v-if="showVisualize && canInteract" 
        class="liu-hover cbrt-tip cbrt-visualize"
        @click.stop="onTapVisualize"
      >
        <span>{{ t('editor.one_click') }}</span>
      </div>
      <div v-if="showVisualize && canInteract" class="cbrt-line" />

      <!-- Copy Button -->
      <div v-if="canInteract"
        class="cbrt-btn" 
        :class="{ 'cbrt-btn_no_pointer': showCopied }"
        @click.stop="onTapCopyCode"
      >
        <svg-icon name="copy" color="var(--code-btn-text)" class="cbrt-btn-svg"></svg-icon>
        <div class="liu-no-user-select cbrt-btn-text">
          <span 
            v-if="selectedLanguage === 'plaintext' || selectedLanguage === 'markdown'"
          >{{ t('editor.copy_text') }}</span>
          <span v-else>{{ t('editor.copy_code') }}</span>
        </div>

        <div class="cbrt-copied" :class="{ 'cbrt-copied_show': showCopied }">
          <svg-icon name="check" color="var(--code-btn-text)" class="cbrt-btn-svg"></svg-icon>
          <div class="liu-no-user-select cbrt-btn-text">
            <span>{{ t('common.copied') }}</span>
          </div>
        </div>

      </div>
    </div>

    <pre spellcheck="false"><code><node-view-content /></code></pre>

    <div v-if="!isBriefing && node.attrs?.needFold" class="cb-fold-container">
      <div class="cb-fold-box" @click.stop="onTapExpandCode">
        <div class="cb-fold-text">
          <span>{{ t('editor.expand_code') }}</span>
        </div>
        <div class="cb-fold-circle">
          <svg-icon name="arrow-right2" color="var(--code-btn-text)" class="cb-fold-svg"></svg-icon>
        </div>
      </div>
    </div>
  </node-view-wrapper>
</template>

<script lang="ts">
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { createHighlightRefresh } from './tools/refresh-highlighting'
import liuUtil from '~/utils/liu-util'
import { useI18n } from 'vue-i18n'
import { computed, ref, inject } from 'vue'
import { 
  ensureLowlightLanguages,
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
import { editorBriefingKey, editorCanInteractKey } from "~/utils/provide-keys"
import { useRouteAndLiuRouter } from '~/routes/liu-router'
import { deviceChaKey } from '~/utils/provide-keys'
import cui from '~/components/custom-ui'

export default {
  components: {
    NodeViewWrapper,
    NodeViewContent,
  },

  props: nodeViewProps,

  setup(props) {
    const { t } = useI18n()
    const leaveTip = liuUtil.getHelpTip("Mod_Enter")
    const languages = computed(() => showProgrammingLanguages())
    const cha = inject(deviceChaKey)
    const rr = useRouteAndLiuRouter()

    void ensureLowlightLanguages().then((justLoaded) => {
      if (!justLoaded || props.editor.isDestroyed) return
      const pos = typeof props.getPos === "function" ? props.getPos() : undefined
      if (typeof pos === "number") {
        const tr = createHighlightRefresh(props.editor.state, pos)
        if (tr) props.editor.view.dispatch(tr)
      }
    })

    const isBriefing = inject(editorBriefingKey, ref(false))

    const selectedLanguage = computed(() => {
      const _lang = props.node.attrs.language as CbcLang
      if(!_lang) return _lang
      const lang = showToSupported(_lang)
      return lang
    })

    const langDisplayed = computed({
      get: () => {
        const s = selectedLanguage.value
        if(!s) return s
        const s2 = supportedToShow(s)
        return s2
      },
      set: (lang: CbcLang) => {
        const language = showToSupported(lang)
        props.updateAttributes({ language })
      }
    })

    const showVisualize = computed(() => {
      if(cha?.isIOS && cha?.isInWebView) return false
      const lang = langDisplayed.value
      return Boolean(lang === "HTML")
    })

    let copiedTimeout: LiuTimeout
    const showCopied = ref(false)

    const _getCodePlainText = () => {
      const attrs = liuUtil.toRawData(props.node.attrs)
      const originalText = attrs.originalText
      if(originalText) return originalText

      //@ts-expect-error
      const c = liuUtil.toRawData(props.node.content) as CbcFragment
      const text = c?.content?.[0].text
      return text
    }

    const onTapCopyCode = () => {
      const text = _getCodePlainText()
      if(!text) return
      liuApi.copyToClipboard(text)
      showCopied.value = true
      if(copiedTimeout) clearTimeout(copiedTimeout)
      copiedTimeout = setTimeout(() => {
        copiedTimeout = undefined
        showCopied.value = false
      }, 2000)
    }

    const onTapVisualize = () => {
      const text = _getCodePlainText()
      if(!text) return
      liuUtil.open.visualizeCode(text, { rr })
    }

    const onTapExpandCode = () => {
      const text = _getCodePlainText()
      if(!text) return

      const _lang = props.node.attrs.language
      cui.browseCode({ code: text, language: _lang })
    }

    const canInteract = inject(editorCanInteractKey, ref(true))

    return { 
      t, 
      languages, 
      isBriefing,
      isMobile: cha?.isMobile,
      isSafari: cha?.isSafari,
      leaveTip, 
      selectedLanguage,
      langDisplayed,
      showVisualize,
      onTapCopyCode,
      onTapVisualize,
      onTapExpandCode,
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
      user-select: none;
      -webkit-user-select: none;
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
      padding-inline: 6px;
      margin-inline-end: 6px;
    }

    .cbrt-visualize {
      --visualize-angle: 45deg;
      background: linear-gradient(var(--visualize-angle), var(--inverse-primary), var(--primary-color) 70%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
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
      .cbrt-visualize:hover {
        --visualize-angle: -15deg;
      }

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
      color: var(--code-btn-text);
      font-size: var(--mini-font);
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

  .cb-fold-container {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    display: flex;
    justify-content: center;
    width: calc(100% - 1rem);
    background: var(--code-block-gradient);

    .cb-fold-box {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: .15s;
      padding: 20px 8px 4px;
    }

    @media(hover: hover) {
      .cb-fold-box:hover {
        opacity: .8;
      }
    }

    .cb-fold-text {
      margin-inline-end: 8px;
      color: var(--code-btn-text);
      font-size: var(--mini-font);
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
    }

    .cb-fold-circle {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.6px solid var(--code-btn-text);
    }

    .cb-fold-svg {
      width: 12px;
      height: 12px;
      transform: rotate(90deg);
    }

  }

}

</style>
