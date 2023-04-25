<script setup lang="ts">
import { useEditContent } from './tools/useEditContent';
import PlaceholderView from '~/views/common/placeholder-view/placeholder-view.vue';
import CustomEditor from '~/components/editors/custom-editor/custom-editor.vue';
import { useCustomEditorLastBar } from "~/pages/utils/useCustomEditorLastBar"

const {
  threadId,
  state,
  onNodata,
  onHasdata,
  onUpdated,
} = useEditContent()

const { lastBar } = useCustomEditorLastBar()

</script>
<template>
  
  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box">
      <PlaceholderView
        :p-state="state"
      ></PlaceholderView>
      <div v-if="threadId && state < 50"
        v-show="state < 0"
      >
        <CustomEditor
          :thread-id="threadId"
          :last-bar="lastBar"
          @hasdata="onHasdata"
          @nodata="onNodata"
          @updated="onUpdated"
          class="ec-custom-editor"
          :class="{ 'ec-custom-editor_show': state === -1 }"
        ></CustomEditor>
      </div>
      
    </div>
  </div>

</template>
<style scoped>

.ec-custom-editor {
  transition: opacity .25s;
  opacity: 0;
}

.ec-custom-editor_show {
  opacity: 1;
}

</style>