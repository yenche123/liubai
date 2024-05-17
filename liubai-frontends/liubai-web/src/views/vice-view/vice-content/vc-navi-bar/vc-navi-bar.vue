<script lang="ts" setup>
import cfg from "~/config"
import type { VcState } from "../tools/types"
import { computed, type PropType } from "vue";
import liuApi from "~/utils/liu-api";
import { useVcNaviBar } from "./tools/useVcNaviBar"

const props = defineProps({
  vcState: {
    type: String as PropType<VcState>,
    required: true,
  },
})

defineEmits<{
  (event: "tapback"): void
  (event: "tapclose"): void
  (event: "tapopeninnew"): void
}>()

const { isMobile } = liuApi.getCharacteristic()
const naviWidth = computed(() => {
  if(isMobile) return `100%`
  const state = props.vcState
  if(state === 'third' || state === 'iframe') return `100%`
  return 'calc(100% - 10px)'
})
const iconColor = "var(--main-normal)"

const {
  vnbData,
} = useVcNaviBar()

</script>
<template>

  <div class="liu-frosted-glass vcliu-navi-bar">

    <!-- 返回键 -->
    <div class="liu-hover vcliu-navi-btn" @click="$emit('tapback')">
      <svg-icon class="vcliu-navi-icon" name="arrow-back" :color="iconColor"></svg-icon>
    </div>

    <!-- 关闭按钮 -->
    <div class="liu-hover vcliu-navi-btn" @click="$emit('tapclose')"
      v-show="vnbData.showCloseBtn"
    >
      <svg-icon class="vcliu-navi-icon" name="close" :color="iconColor"></svg-icon>
    </div>

    <div class="vcliu-navi-footer">
      <!-- 用新分页打开 -->
      <div class="liu-hover vcliu-navi-btn" @click="$emit('tapopeninnew')"
        :class="{ 'vcliu-nv-open': !isMobile }"
      >
        <svg-icon class="vcn-open-new" name="open_in_new" :color="iconColor"></svg-icon>
      </div>
    </div>

  </div>

  <div v-if="vcState === 'iframe'" class="vcliu-virtual"></div>

</template>
<style lang="scss" scoped>

.vcliu-navi-bar {
  width: 100%;
  width: v-bind("naviWidth"); /** 减掉 10px 是因为滚动条的宽度 */
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

.vcliu-nv-open {
  width: v-bind("'' + (10 + cfg.vice_navi_height) + 'px'");  /** 加 10px，是为了包含那个滚动条 */
  margin-right: -10px;
}

.vcliu-navi-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}


</style>