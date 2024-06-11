<script setup lang="ts">
import { PropType, inject } from "vue";
import LiuMenu from "~/components/common/liu-menu/liu-menu.vue"
import { type MenuItem } from "~/components/common/liu-menu/tools/types";
import liuApi from '~/utils/liu-api';
import { deviceChaKey } from "~/utils/provide-keys";

defineProps({
  isPC: {
    type: Boolean,
  },
  node: {
    type: Object,
    required: true,
  },
  stat: {
    type: Object,
    required: true,
  },
  currentTagId: {
    type: String,
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
}>()

const cha = inject(deviceChaKey)

</script>
<template>

  <div class="liu-hover tag-container" :class="{ 'tag-container_selected': node.tagId === currentTagId }">

    <!-- tag 所在的该行 -->
    <div class="tag-box">
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
      <div class="tag-title">
        <span>{{ node.text }}</span>
      </div>

      <div class="tag-bg"></div>
    </div>

    <!-- 更多 -->
    <LiuMenu :menu="stat.level < 3 ? menuList2 : menuList" min-width-str="100px"
      @tapitem="(item2, index2) => $emit('tapmenuitem', item2, index2, node, stat)">
      <div class="liu-hover tag-more" :class="{ 'tag-more_always': !isPC }">
        <svg-icon class="tag-more-icon" name="more" color="var(--main-normal)"></svg-icon>
      </div>
    </LiuMenu>


  </div>


</template>
<style lang="scss" scoped>


.tag-container {
  position: relative;
  padding: 5px 0;
  transition: .15s;
  margin-block-end: 3px;

  .tag-box {
    display: flex;
    align-items: center;
    flex: 1;
    user-select: none;

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
      user-select: none;
    }

    .tag-bg {
      position: absolute;
      top: 0;
      left: 40px;
      right: 0;
      bottom: 0;
    }

  }

}

.tag-container_selected::before {
  opacity: .06;
}

.tag-more {
  position: absolute;
  top: 5px;
  right: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: .1s;
  opacity: 0;

  .tag-more-icon {
    width: 26px;
    height: 26px;
  }
}

.tag-container:hover .tag-more {
  opacity: 1;
}

.tag-more_always {
  opacity: 1;
}


@container sidebar (max-width: 190px) {
  .tag-container {
    padding: 5px 0;
    margin-block-end: 3px;

    .tag-box {
      .tag-arrow {
        width: 28px;
        height: 28px;
        margin-inline-start: 3px;
        margin-inline-end: 0px;
        border-radius: 6px;

        .tag-arrow-icon {
          width: 22px;
          height: 22px;
        }
      }

      .tag-icon {
        width: 32px;
        height: 32px;
      }

      .tag-bg {
        left: 31px;
      }

    }

    
  }

  .tag-more {
    top: 7px;
    right: 2px;
    width: 28px;
    height: 28px;

    .tag-more-icon {
      width: 24px;
      height: 24px;
    }

  }
}


</style>