<script setup lang="ts">
import cfg from "~/config"
import CustomEditor from "~/components/editors/custom-editor/custom-editor.vue"
import IndexBoard from "~/components/level1/index-board/index-board.vue"
import ThreadList from "~/components/level1/thread-list/thread-list.vue"
import { useIndexContent } from "./tools/useIndexContent"

defineProps({
  showTop: {
    type: Boolean,
  }
})

const virtualHeight = cfg.navi_height / 3
const shortVirtual = cfg.navi_height / 9

const {
  showTxt
} = useIndexContent()

</script>
<template>

  <div class="liu-mc-container">
    <div class="mc-virtual"
      :class="{ 'mc-virtual_short': !showTop }"
    ></div>
    <div class="liu-mc-box">
      
      <CustomEditor></CustomEditor>
      <div class="liu-mc-spacing"></div>

      <IndexBoard></IndexBoard>

      <!-- 置顶 -->
      <ThreadList
        view-type="PINNED"
        :show-txt="showTxt"
      ></ThreadList>

      <!-- 一般 -->
      <ThreadList
        view-type="INDEX"
        :show-txt="showTxt"
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