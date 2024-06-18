<script setup lang="ts">
import { useEditContent } from './tools/useEditContent';
import CustomEditor from '~/components/editors/custom-editor/custom-editor.vue';

const {
  threadId,
  state,
  forceUpdateNum,
  onNodata,
  onHasdata,
  onUpdated,
  onEditing,
} = useEditContent()

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
          @hasdata="onHasdata"
          @nodata="onNodata"
          @updated="onUpdated"
          @editing="onEditing"
          class="ec-custom-editor"
          :class="{ 'ec-custom-editor_show': state === -1 }"
          :force-update-num="forceUpdateNum"
        ></CustomEditor>

        <div class="ec-virtual"></div>
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

.ec-virtual {
  width: 100%;
  height: 100px;
}


</style>