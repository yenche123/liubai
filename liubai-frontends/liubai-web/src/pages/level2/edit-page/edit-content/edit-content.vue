<script setup lang="ts">
import { useEditContent } from './tools/useEditContent';
import PlaceholderView from '~/views/common/placeholder-view/placeholder-view.vue';
import CustomEditor from '~/components/custom-editor/custom-editor.vue';

const {
  threadId,
  state,
  onNodata,
  onHasdata,
} = useEditContent()

</script>
<template>
  
  <div class="mc-container">
    <div class="tc-virtual"></div>
    <div class="mc-box">
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
          class="ec-custom-editor"
          :class="{ 'ec-custom-editor_show': state === -1 }"
        ></CustomEditor>
      </div>
      
    </div>
  </div>

</template>
<style scoped>

.mc-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.tc-virtual {
  width: 100%;
  height: 10px;
}

.mc-box {
  width: 90%;
  max-width: var(--card-max);
  min-width: var(--card-min);
  position: relative;
}

.ec-custom-editor {
  transition: opacity .25s;
  opacity: 0;
}

.ec-custom-editor_show {
  opacity: 1;
}

</style>