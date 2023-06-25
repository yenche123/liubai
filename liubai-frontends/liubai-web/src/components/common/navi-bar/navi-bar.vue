<script setup lang="ts">
import cfg from "~/config"
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { useNaviBar } from "./tools/useNaviBar";

const { router } = useRouteAndLiuRouter()
const props = defineProps({
  title: {
    type: String,
    default: ""
  }
})

const onTapBack = (e: MouseEvent) => {
  router.naviBack()
}


const {
  showMenuBtn,
  onTapMenu
} = useNaviBar()

</script>
<template>

  <div class="liu-frosted-glass nb-container">

    <div class="nb-box">
      <!-- back -->
      <div class="liu-hover nbb-normal" @click.stop="onTapBack"
        :class="{ 'nbb-small': showMenuBtn }"
      >
        <SvgIcon class="nb-icon" name="arrow-back700"></SvgIcon>
      </div>
      <!-- menu -->
      <div v-if="showMenuBtn" 
        class="liu-hover nbb-normal nbb-small" 
        @click="onTapMenu"
      >
        <SvgIcon class="nb-icon" name="menu"></SvgIcon>
      </div>
      <div class="nb-title"
        :style="{ 'margin-inline-start': showMenuBtn ? '10px' : '6px' }"
      >
        <span>{{ title }}</span>
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

  .nb-box {
    width: 92%;
    height: 100%;
    max-width: var(--card-max);
    min-width: var(--card-min);
    display: flex;
    align-items: center;
    position: relative;
  }
}

.nbb-normal {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  .nb-icon {
    width: 26px;
    height: 26px;
  }
}

.nbb-small {
  width: 34px;
  height: 34px;

  .nb-icon {
    width: 24px;
    height: 24px;
  }
}


.nb-title {
  position: relative;
  font-size: var(--desc-font);
  color: var(--main-text);
  line-height: 1.5;
  font-weight: 700;
  user-select: none;
}

</style>