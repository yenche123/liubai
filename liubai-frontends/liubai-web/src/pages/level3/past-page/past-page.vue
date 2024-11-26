<script lang="ts" setup>
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ChatScroll from "~/components/common/chat-scroll/chat-scroll.vue";
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";

const { 
  hiddenScrollBar,
  onVvWidthChange,
  scrollPosition,
  onScroll,
} = useMainVice()
const { t } = useI18n()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <chat-scroll :hidden-scroll-bar="hiddenScrollBar" @scroll="onScroll">
      

      <div class="pp-test">最底部</div>
      <div class="pp-test"></div>
      <div class="pp-test" style="background-color: aquamarine;"></div>
      <div class="pp-test"></div>
      <div class="pp-test" style="background-color: black;"></div>
      <div class="pp-test">
        <div class="pp-test-inner">你好</div>
      </div>
      <div class="pp-test">最上方</div>
      
    </chat-scroll>
    <navi-bar :title="t('calendar.past')"></navi-bar>

  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped lang="scss">

.pp-test {
  background-color: antiquewhite;
  width: 200px;
  height: 200px;
  margin-block-end: 20px;
}

.pp-test-inner {
  color: red;
}


</style>