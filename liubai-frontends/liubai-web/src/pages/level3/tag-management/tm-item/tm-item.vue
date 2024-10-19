<script lang="ts" setup>
import { type TagView } from '~/types/types-atom';
import { type PropType } from 'vue';
import { LiuTagTreeStat } from '~/types';
import liuApi from '~/utils/liu-api';
import LiuMenu from "~/components/common/liu-menu/liu-menu.vue";
import { type MenuItem } from '~/components/common/liu-menu/tools/types';

defineProps({
  node: {
    type: Object as PropType<TagView>,
    required: true,
  },
  stat: {
    type: Object as PropType<LiuTagTreeStat>,
    required: true,
  },
  menuList: {
    type: Array as PropType<MenuItem[]>
  },
  menuList2: {
    type: Array as PropType<MenuItem[]>
  },
})

defineEmits<{
  (evt: "taptagarrow", evt2: MouseEvent, node: any, stat: any): void
  (evt: "tapmenuitem", item: MenuItem, idx: number, node: any, stat: any): void
  (evt: "tapitem"): void
}>()

</script>
<template>

  <div class="liu-hover tag-container" @click.stop="$emit('tapitem')">

    <!-- tag 所在的该行 -->
    <div class="liu-no-user-select tag-box">
      <div class="liu-hover tag-arrow" :class="{ 'tag-arrow_unhover': !stat.children.length }"
        @click.stop.prevent="$emit('taptagarrow', $event, node, stat)">
        <SvgIcon v-if="stat.children.length" class="tag-arrow-icon" 
          :class="{ 'tag-arrow-icon_open': stat.open }"
          name="arrow-right" color="var(--main-normal)"
        ></SvgIcon>
        <div v-else class="tag-arrow-dot"></div>
      </div>
      <div v-if="node.icon" class="tag-icon">
        <span>{{ liuApi.decode_URI_component(node.icon) }}</span>
      </div>
      <div class="liu-no-user-select tag-title">
        <span>{{ node.text }}</span>
      </div>

      <!-- menu -->
      <LiuMenu :menu="stat.level < 3 ? menuList2 : menuList"
        min-width-str="100px"
        placement="bottom-end"
        @tapitem="(item2, index2) => $emit('tapmenuitem', item2, index2, node, stat)"
      >
        <div class="liu-hover tag-more">
          <svg-icon class="tag-more-icon" name="more" color="var(--main-normal)"></svg-icon>
        </div>
      </LiuMenu>

    </div>


  </div>



</template>
<style scoped lang="scss">

.tag-container {
  position: relative;
  padding: 5px 0;
  transition: .15s;
}

.tag-box {
  display: flex;
  align-items: center;
  flex: 1;
}

.tag-arrow {
  width: 32px;
  height: 32px;
  margin-inline-start: 4px;
  margin-inline-end: 4px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-arrow-icon {
  width: 24px;
  height: 24px;
}

.tag-arrow-icon_open {
  transform: rotate(90deg);
}

.tag-arrow-dot {
  width: 5px;
  height: 5px;
  border-radius: 10px;
  background-color: var(--main-normal);
}

.tag-arrow_unhover {
  cursor: auto;

  &:hover::before {
    opacity: 0;
  }

  &:active::before {
    opacity: 0;
  }
}

.tag-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  font-size: var(--desc-font);
}

.tag-title {
  flex: 1;
  font-size: var(--btn-font);
  color: var(--main-normal);
}

.tag-more {
  width: 32px;
  height: 32px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: 4px;

  .tag-more-icon {
    width: 26px;
    height: 26px;
  }

}


</style>