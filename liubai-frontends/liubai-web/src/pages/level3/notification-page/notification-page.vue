<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ViceView from "~/views/vice-view/vice-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import NotificationContent from "./notification-content/notification-content.vue";
import { useMainVice } from "~/hooks/useMainVice";
import { useI18n } from "vue-i18n";

const { hiddenScrollBar, onVvWidthChange } = useMainVice()
const { t } = useI18n()

</script>
<template>

  <!-- 主视图 -->
  <main-view>
    <scroll-view :hidden-scroll-bar="hiddenScrollBar">
      <navi-virtual></navi-virtual>
      <NotificationContent></NotificationContent>
    </scroll-view>
    <navi-bar :title="t('common.notification')"></navi-bar>
  </main-view>

  <!-- 副视图 -->
  <vice-view @widthchange="onVvWidthChange"></vice-view>

</template>
<style scoped>

</style>