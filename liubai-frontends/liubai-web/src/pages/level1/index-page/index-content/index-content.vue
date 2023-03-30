<script setup lang="ts">
import cfg from "~/config"
import CustomEditor from "~/components/custom-editor/custom-editor.vue"
import ThreadList from "~/components/level1/thread-list/thread-list.vue"
import { useCustomEditorLastBar } from "~/pages/utils/useCustomEditorLastBar"

defineProps({
  showTop: {
    type: Boolean,
  }
})

const virtualHeight = cfg.navi_height / 3
const shortVirtual = cfg.navi_height / 9
const { lastBar } = useCustomEditorLastBar()

</script>
<template>

  <div class="liu-mc-container">
    <div class="mc-virtual"
      :class="{ 'mc-virtual_short': !showTop }"
    ></div>
    <div class="liu-mc-box">
      
      <CustomEditor :last-bar="lastBar"></CustomEditor>
      <div class="liu-mc-spacing"></div>

      <!-- 置顶 -->
      <ThreadList
        view-type="PINNED"
      ></ThreadList>

      <!-- 一般 -->
      <ThreadList
        view-type="INDEX"
      ></ThreadList>

    </div>

  </div>
  
</template>
<style scoped lang="scss">

.mc-virtual {
  width: 100%;
  height: v-bind("virtualHeight + 'px'");
  max-height: v-bind("virtualHeight + 'px'");
  transition: .15s;
}

.mc-virtual_short {
  max-height: v-bind("shortVirtual + 'px'");
}


</style>