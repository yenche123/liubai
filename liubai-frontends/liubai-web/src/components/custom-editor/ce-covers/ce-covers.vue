<script lang="ts">
import DraggAble from 'vuedraggable'
import { defineComponent } from 'vue';
import type { ImageShow } from '../../../types';
import liuApi from "../../../utils/liu-api"

export default defineComponent({
  components: {
    DraggAble
  },
  props: {
    modelValue: {
      type: Array<ImageShow>,
    }
  },
  emits: ['update:modelValue', 'clear'],
  setup(props) {
    const imgWidth = 140    
    const cha = liuApi.getCharacteristic()

    return { imgWidth, cha }
  },
  methods: {
    onListUpdate(newV: ImageShow[]) {
      console.log("onListUpdate..........")
      console.log(newV)
      console.log(" ")
      this.$emit("update:modelValue", newV)
    },

    onTapClear(e: MouseEvent, index: number) {
      this.$emit("clear", index)
      e.stopPropagation()
    },
  },
})

</script>
<template>

  <DraggAble v-if="modelValue?.length" 
    class="cc-container"
    :modelValue="modelValue"
    @update:modelValue="onListUpdate"
    :animation="300"
    handle=".cec-drag"
    ghost-class="ghost"
    item-key="id"
  >
    <template #item="{ element, index }">

      <div class="cec-item">

        <liu-img :src="element.src" 
          :width="imgWidth" 
          :height="imgWidth"
          class="cc-img"
          object-fit="cover"
        ></liu-img>

        <!-- 右上角的删除按钮 -->
        <div class="cec-delete"
          @click="onTapClear($event, index)"
        >
          <svg-icon name="close" 
            class="cec-icon"
            color="#e0e0e0"
          ></svg-icon>
        </div>

        <!-- 右下角的拖动按钮 -->
        <div class="cec-drag"
          :class="{ 'cec-drag_mobile': cha.isMobile }"
        >
          <svg-icon name="drag_indicator" 
            class="cec-drag-icon"
            color="#f1f1f1"
          ></svg-icon>
        </div>

      </div>
      
    </template>
  </DraggAble>

</template>
<style lang="scss">

.cc-container {
  display: flex;
  flex-wrap: wrap;
  flex: 1;

  .cec-item {
    width: v-bind("imgWidth + 'px'");
    height: v-bind("imgWidth + 'px'");
    overflow: hidden;
    border-radius: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
    position: relative;

    .cec-delete {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 30px;
      height: 30px;
      cursor: pointer;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, .66);
    }

    .cec-drag {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 38px;
      height: 38px;
      cursor: move;
      border-top-left-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: .15s;
      opacity: 0;
    }

    .cec-drag_mobile {
      opacity: 1;
    }

    .cec-drag::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      content: "";
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      border-radius: 20px 0 10px 0;
      overflow: hidden;
    }

    .cec-icon {
      width: 20px;
      height: 20px;
    }

    .cec-drag-icon {
      width: 28px;
      height: 28px;
      position: relative;
      filter: drop-shadow(0 1px 0px rgba(0, 0, 0, .5));
    }

    .cc-img {
      width: v-bind("imgWidth + 'px'");
      height: v-bind("imgWidth + 'px'");
    }

  }

  .cec-item:hover .cec-drag {
    opacity: 1;
  }

}

/** the following is for draggable */

.flip-list-move {
  transition: transform 0.45s;
}

.no-move {
  transition: transform 0s;
}

.ghost {
  opacity: 0.3;
}


</style>