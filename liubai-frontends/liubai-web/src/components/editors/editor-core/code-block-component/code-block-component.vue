<template>
  <node-view-wrapper class="code-block">

    <!-- 编辑模式 -->
    <div v-if="editor.isEditable" class="cb-right-top">

      <div class="code-block-tip"
        :class="{ 'code-block-tip_hidden': !editor.isActive('codeBlock') }"
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
    </div>

    <pre><code><node-view-content /></code></pre>
  </node-view-wrapper>
</template>

<script lang="ts">
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import liuUtil from '~/utils/liu-util'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { 
  showProgrammingLanguages,
  supportedToShow,
  showToSupported,
} from "~/utils/other/lowlight-related"

type SelectedLang = string | null

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

    const selectedLanguage = computed(() => {
      const _lang = props.node.attrs.language as SelectedLang
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
      set: (lang: SelectedLang) => {
        let language = showToSupported(lang)
        props.updateAttributes({ language })
      }
    })

    return { 
      t, 
      languages, 
      leaveTip, 
      selectedLanguage,
      showLanguage,
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

      &[disabled] {
        opacity: 0.8;
        cursor: auto;
      }
    }

  }

  .cb-right-top_read {
    position: absolute;
    top: 0.2rem;
    right: 0.5rem;
    width: calc(100% - 1rem);
    display: flex;
    align-items: center;
    justify-content: flex-end;

    .cbrt-tip {
      font-size: var(--mini-font);
      font-family: inherit;
      color: #686868;
      user-select: none;
    }
  }

}

</style>
