<script lang="ts" setup>
import { ref } from "vue";
import type { PropType } from 'vue';
import { useStateNavi } from "./tools/useStateNavi"
import type { 
  StateWhichPage, 
  SnIndicatorData 
} from "../tools/types"
import cfg from "~/config"

const props = defineProps({
  current: {
    type: Number as PropType<StateWhichPage>,
    default: 0,
  },
  indicatorData: {
    type: Object as PropType<SnIndicatorData>,
    required: true,
  },
  pageIn: {
    type: Number as PropType<StateWhichPage>,
    default: 0,
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
  reloadData,
} = useStateNavi(props)

const defaultColor = "var(--main-code)"
const selectedColor = "var(--main-normal)"

const onTapNavi = (index: StateWhichPage) => {
  if(index === props.current) return
  emits("tapnavi", index)
}

const reloadRotateDeg = ref(0)
const onTapReload = () => {
  reloadData?.tapreload()
  reloadRotateDeg.value += 360
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
          :class="{ 'sn-toggle-item_selected': current === 1 }"
          @click="onTapNavi(1)"
        >
          <SvgIcon class="snt-icon" name="list"
            :color="current === 1 ? selectedColor : defaultColor"
          ></SvgIcon>
          <span>{{ t('common.list') }}</span>
        </div>

        <div class="sn-toggle-item" 
          ref="indiKanbanEl"
          :class="{ 'sn-toggle-item_selected': current === 2 }"
          @click="onTapNavi(2)"
        >
          <SvgIcon class="snt-icon" name="kanban"
            :color="current === 2 ? selectedColor : defaultColor"
          ></SvgIcon>
          <span>{{ t('common.kanban') }}</span>
        </div>

        <div class="sn-toggle-indicator"></div>

      </div>

      <!-- footer: 添加按钮 -->
      <div class="sn-footer">

        <!-- 刷新 -->
        <div class="liu-hover snf-box"
          :aria-label="t('common.refresh')"
          v-if="reloadData?.showReload.value"
          @click="onTapReload"
        >
          <svg-icon name="refresh" class="snf-svg"></svg-icon>
        </div>

        <!-- 添加 -->
        <div class="liu-hover snf-box"
          :aria-label="t('state_related.add_state')"
        >
          <svg-icon name="add" class="snf-svg_add"></svg-icon>
        </div>

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
  position: v-bind("pageIn === 1 ? 'sticky' : 'relative'");
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

    &:first-child {
      margin-inline-end: 7px;
    }

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

.sn-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.snf-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-start: 6px;

  .snf-svg {
    width: 24px;
    height: 24px;
    transition: .6s;
    transform: v-bind("'rotate(' + reloadRotateDeg + 'deg)'");
  }

  .snf-svg_add {
    width: 27px;
    height: 27px;
  }
}




@media screen and (max-width: 400px) {

  .sn-back-box {
    width: 32px;
    height: 32px;
    margin-inline-end: 3px;

    .nb-back-icon {
      width: 22px;
      height: 22px;
    }
  }

  .sn-toggle {
    height: 44px;
    border-radius: 5px;

    .sn-toggle-item {
      height: 38px;
      padding: 0 10px;
      font-size: var(--mini-font);

      &:first-child {
        margin-inline-end: 2px;
      }

      .snt-icon {
        width: 16px;
        height: 16px;
        margin-inline-end: 6px;
      }
    }

    .sn-toggle-indicator {
      top: 6px;
      height: 32px;
      border-radius: 12px;
    }
  }

  .snf-box {
    width: 32px;
    height: 32px;

    .snf-svg {
      width: 20px;
      height: 20px;
    }

    .snf-svg_add {
      width: 24px;
      height: 24px;
    }
  }
}



</style>