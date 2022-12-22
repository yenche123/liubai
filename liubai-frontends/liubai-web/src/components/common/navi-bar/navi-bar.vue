<script setup lang="ts">
import cfg from "../../../config"
import { useRouteAndLiuRouter } from "../../../routes/liu-router";

const { router } = useRouteAndLiuRouter()
const props = defineProps({
  title: {
    type: String,
    default: ""
  }
})

const onTapBack = () => {
  router.naviBack()
}

</script>
<template>

  <div class="liu-frosted-glass nb-container">

    <div class="nb-box">
      <div class="liu-hover nb-back-box" @click="onTapBack">
        <SvgIcon class="nb-back-icon" name="arrow-back700"></SvgIcon>
      </div>
      <div class="nb-title">
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

.nb-back-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: 6px;

  .nb-back-icon {
    width: 26px;
    height: 26px;
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