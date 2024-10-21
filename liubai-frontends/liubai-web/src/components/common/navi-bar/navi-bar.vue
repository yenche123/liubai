<script setup lang="ts">
import cfg from "~/config"
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { useI18n } from "vue-i18n";
import { naviBarProps, type NaviBarEmit } from "./tools/types"

const { router } = useRouteAndLiuRouter()
const props = defineProps(naviBarProps)
defineEmits<NaviBarEmit>()

const onTapBack = (e: MouseEvent) => {
  router.naviBack()
}

const { t } = useI18n()

</script>
<template>

  <div class="liu-frosted-glass nb-container">

    <div class="nb-box">
      <!-- back -->
      <div class="liu-hover nbb-normal" @click.stop="onTapBack"
        style="margin-inline-start: -6px;"
      >
        <SvgIcon class="nb-icon" name="arrow-back700"></SvgIcon>
      </div>

      <!-- title -->
      <div class="liu-no-user-select nb-title">
        <span v-if="title">{{ title }}</span>
        <span v-else-if="titleKey">{{ t(titleKey) }}</span>
        <span v-else-if="placeholderKey">{{ t(placeholderKey) }}</span>
      </div>

      <!-- add -->
      <div v-if="showAdd" 
        class="liu-hover nbb-normal"
        style="margin-inline-end: -10px;"
        @click="$emit('tapadd')"
      >
        <SvgIcon class="nb-icon_add" name="add"></SvgIcon>
      </div>

    </div>

  </div>

</template>
<style scoped lang="scss">
.nb-container {
  width: calc(100% - 10px);    /** 剪掉 10px 是因为滚动条 */
  height: v-bind("cfg.navi_height + 'px'");
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  z-index: 540;
  container-type: inline-size;
  container-name: nb-container;
}

.nb-box {
  width: var(--card-percent);
  height: 100%;
  max-width: var(--card-max);
  min-width: var(--card-min);
  display: flex;
  align-items: center;
  position: relative;
}

.nbb-normal {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;

  .nb-icon {
    width: 26px;
    height: 26px;
  }

  .nb-icon_add {
    width: 30px;
    height: 30px;
  }
}

.nb-title {
  position: relative;
  font-size: var(--desc-font);
  color: var(--main-text);
  line-height: 1.5;
  font-weight: 700;
  flex: 1;
  margin-inline-start: 6px;
}

/** the container query below is following `@container liu-mc-container` in style.css */

@container nb-container (min-width: 460px) {
  .nb-container > .nb-box {
    width: 90%;
  }
}

@container nb-container (min-width: 500px) {
  .nb-container > .nb-box {
    width: 88%;
  }
}

@container nb-container (min-width: 560px) {
  .nb-container > .nb-box {
    width: 85%;
  }
}

@container nb-container (min-width: 610px) {
  .nb-container > .nb-box {
    width: 80%;
  }
}


</style>