<script lang="ts" setup>
import cfg from "~/config"
import type { VcState } from "../tools/types"
import type { PropType } from "vue";

defineProps({
  vcState: {
    type: String as PropType<VcState>,
    required: true,
  },
})

const emits = defineEmits<{
  (event: "tapback"): void
  (event: "tapclose"): void
  (event: "tapopeninnew"): void
}>()

const iconColor = "var(--main-normal)"

</script>
<template>

  <div class="liu-frosted-glass vcliu-navi-bar">

    <!-- 返回键 -->
    <div class="liu-hover vcliu-navi-btn" @click="emits('tapback')">
      <svg-icon class="vcliu-navi-icon" name="arrow-back" :color="iconColor"></svg-icon>
    </div>

    <!-- 关闭按钮 -->
    <div class="liu-hover vcliu-navi-btn" @click="emits('tapclose')">
      <svg-icon class="vcliu-navi-icon" name="close" :color="iconColor"></svg-icon>
    </div>

    <div class="vcliu-navi-footer">
      <!-- 用新分页打开 -->
      <div class="liu-hover vcliu-navi-btn" @click="emits('tapopeninnew')">
        <svg-icon class="vcn-open-new" name="open_in_new" :color="iconColor"></svg-icon>
      </div>
    </div>

  </div>

  <div v-if="vcState === 'iframe'" class="vcliu-virtual"></div>

</template>
<style lang="scss" scoped>

.vcliu-navi-bar {
  width: 100%;
  height: v-bind("cfg.vice_navi_height + 'px'");
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  z-index: 710;
}

.vcliu-navi-bar::before {
  background: var(--frosted-glass-5);
}

.vcliu-virtual {
  width: 100%;
  height: v-bind("cfg.vice_navi_height + 'px'");
}

.liu-hover::before {
  border-radius: 0;
}

.vcliu-navi-btn {
  width: v-bind("cfg.vice_navi_height + 'px'");
  height: v-bind("cfg.vice_navi_height + 'px'");
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .vcliu-navi-icon {
    width: 50%;
    height: 50%;
  }

  .vcn-open-new {
    width: 40%;
    height: 40%;
  }
}

.vcliu-navi-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}


</style>