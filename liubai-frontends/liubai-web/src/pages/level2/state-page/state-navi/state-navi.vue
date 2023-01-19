<script lang="ts" setup>
import { PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStateNavi } from "./tools/useStateNavi"
import type { StateWhichPage, SnIndicatorData } from "../tools/types"
import cfg from "~/config"

const props = defineProps({
  whichPage: {
    type: Number as PropType<StateWhichPage>,
    default: 0,
  },
  indicatorData: {
    type: Object as PropType<SnIndicatorData>,
    required: true,
  },
})

const emits = defineEmits<{
  (event: "tapnavi", index: StateWhichPage): void
}>()

const {
  t,
  indicatorParentEl,
  indiListEl,
  indiKanbanEl,
  onTapBack,
} = useStateNavi(props)

const defaultColor = "var(--main-code)"
const selectedColor = "var(--main-normal)"

const onTapNavi = (index: StateWhichPage) => {
  if(index === props.whichPage) return
  emits("tapnavi", index)
}

</script>
<template>

  <!--直接使用 sticky 布局-->
  <div class="liu-frosted-glass sn-container">

    <div class="sn-box">

      <!-- 返回按钮 -->
      <div class="liu-hover sn-back-box" @click="onTapBack">
        <SvgIcon class="nb-back-icon" name="arrow-back700"></SvgIcon>
      </div>

      <!-- 列表 / 看板 -->
      <div class="sn-toggle"
        ref="indicatorParentEl"
      >

        <div class="sn-toggle-item" 
          ref="indiListEl"
          :class="{ 'sn-toggle-item_selected': whichPage === 1 }"
          style="margin-inline-end: 7px;"
          @click="onTapNavi(1)"
        >
          <SvgIcon class="snt-icon" name="list"
            :color="whichPage === 1 ? selectedColor : defaultColor"
          ></SvgIcon>
          <span>{{ t('common.list') }}</span>
        </div>

        <div class="sn-toggle-item" 
          ref="indiKanbanEl"
          :class="{ 'sn-toggle-item_selected': whichPage === 2 }"
          @click="onTapNavi(2)"
        >
          <SvgIcon class="snt-icon" name="kanban"
            :color="whichPage === 2 ? selectedColor : defaultColor"
          ></SvgIcon>
          <span>{{ t('common.kanban') }}</span>
        </div>

        <div class="sn-toggle-indicator"></div>

      </div>

      <!-- footer: 添加按钮 -->
      <div class="sn-footer">

      </div>

    </div>

  </div>


</template>
<style scoped lang="scss">

.sn-container {
  width: 100%;
  height: v-bind("cfg.navi_height + 'px'");
  display: flex;
  justify-content: center;
  position: sticky;
  top: 0;
}

.sn-box {
  width: 92%;
  height: 100%;
  min-width: var(--card-min);
  display: flex;
  align-items: center;
  position: relative;
}

.sn-back-box {
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

.sn-toggle {
  display: flex;
  align-items: center;
  height: 50px;
  position: relative;
  border-radius: 6px;
  user-select: none;

  .sn-toggle-item {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 14px;
    font-size: var(--btn-font);
    color: v-bind("defaultColor");
    font-weight: 700;
    z-index: 100;
    cursor: pointer;

    .snt-icon {
      width: 18px;
      height: 18px;
      margin-inline-end: 8px;
    }

  }

  .sn-toggle-item_selected {
    color: v-bind("selectedColor");
  }

  .sn-toggle-indicator {
    position: absolute;
    top: 6px;
    transition: .3s;
    left: v-bind("indicatorData.left");
    width: v-bind("indicatorData.width");
    height: 38px;
    background-color: var(--primary-hover);
    opacity: .08;
    border-radius: 15px;
    z-index: 90;
    box-shadow: var(--tab-shadow);
  }

}


</style>