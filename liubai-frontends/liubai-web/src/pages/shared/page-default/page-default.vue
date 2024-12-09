<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n()

defineProps({
  titleKey: {
    type: String,
    default: "",
  },
  topVirtual: {
    type: Boolean,
    default: true,
  },
  hasTopNavi: {
    type: Boolean,
    default: true,
  },
  showAdd: {
    type: Boolean,
    default: false,
  },
  considerBottomNaviBar: {
    type: Boolean,
    default: false,
  }
})

defineEmits<{
  (evt: "tapadd"): void
}>()


</script>
<template>

  <main-view>
    <scroll-view 
      :consider-bottom-navi-bar="considerBottomNaviBar"
    >
      <navi-virtual v-if="hasTopNavi"></navi-virtual>
      <div class="liu-mc-container">
        <div class="liu-tc-virtual" v-if="topVirtual"></div>
        <div class="liu-mc-box">
          <slot></slot>
        </div>
      </div>
    </scroll-view>
    <navi-bar v-if="hasTopNavi" :title="titleKey ? t(titleKey) : ''"
      :show-add="showAdd"
      @tapadd="$emit('tapadd')"
    ></navi-bar>
  </main-view>

</template>
<style scoped>

</style>