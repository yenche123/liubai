<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import SubscribeContent from "./subscribe-content/subscribe-content.vue"
import NaviBar from "~/components/common/navi-bar/navi-bar.vue";
import NaviVirtual from '~/components/common/navi-virtual/navi-virtual.vue';
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import { type PageState } from "~/types/types-atom";

const { t } = useI18n()

const showTitle = ref(true)
const whenStateChanged = (state: PageState) => {
  showTitle.value = state >= 0
}


</script>
<template>

  <main-view>
    <scroll-view>
      <navi-virtual></navi-virtual>
      <SubscribeContent @statechanged="whenStateChanged"></SubscribeContent>
    </scroll-view>
    <navi-bar :title="showTitle ? t('payment.member_subscribe') : ''"></navi-bar>
  </main-view>

</template>
<style scoped>

</style>