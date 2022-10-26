<template>
  <node-view-wrapper class="code-block">
    <select contenteditable="false" v-model="selectedLanguage">
      <option :value="null">
        auto
      </option>
      <option disabled>
        —
      </option>
      <option v-for="(language, index) in languages" :value="language" :key="index">
        {{ language }}
      </option>
    </select>
    <pre><code><node-view-content /></code></pre>
  </node-view-wrapper>
</template>

<script lang="ts">
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'

export default {
  components: {
    NodeViewWrapper,
    NodeViewContent,
  },

  props: nodeViewProps,

  data() {
    return {
      languages: this.extension.options.lowlight.listLanguages(),
    }
  },

  computed: {
    selectedLanguage: {
      get() {
        return this.node.attrs.language
      },
      set(language: string) {
        this.updateAttributes({ language })
      },
    },
  },
}
</script>

<style lang="scss">
.code-block {
  position: relative;

  select {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
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
      opacity: 0.3;
    }
  }
}

</style>
