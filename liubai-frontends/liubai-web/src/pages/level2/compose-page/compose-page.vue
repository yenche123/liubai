<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import ComposeContent from "./compose-content/compose-content.vue";
import { useI18n } from "vue-i18n";
import { useRouteAndLiuRouter } from "~/routes/liu-router";

const { t } = useI18n()

const rr = useRouteAndLiuRouter()
const onTapHome = () => {
  rr.router.goHome()
}

</script>
<template>

  <MainView enable-drop-files disable-panels>
    <scroll-view>

      <div class="liu-mc-container compose-page">
        <div class="liu-tc-virtual"></div>
        <div class="liu-mc-box">
          <ComposeContent></ComposeContent>
        </div>
      </div>

      <div class="cp-bottom-box">
        <div class="liu-no-user-select liu-hover cp-back-home"
          @click.stop="onTapHome"
        >
          <span>{{ t('common.back_home') }}</span>
        </div>
      </div>

    </scroll-view>
  </MainView>

</template>
<style scoped lang="scss">

.compose-page {
  min-height: 90vh;
  min-height: 90dvh;
}

.liu-tc-virtual {
  height: 20px;
}

.cp-bottom-box {
  width: 100%;
  min-height: 10vh;
  min-height: 10dvh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.cp-back-home {
  color: var(--main-note);
  font-size: var(--mini-font);
  text-align: center;
  width: min(90%, 300px);
  padding: 10px 0;
}

</style>