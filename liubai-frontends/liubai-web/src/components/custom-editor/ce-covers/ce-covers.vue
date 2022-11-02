<script lang="ts">
import DraggAble from 'vuedraggable'
import { defineComponent } from 'vue';
import type { ImageShow } from '../../../types';

export default defineComponent({
  components: {
    DraggAble
  },
  props: {
    modelValue: {
      type: Array<ImageShow>,
    }
  },
  emits: ['update:modelValue'],
  setup(props) {
    const imgWidth = 140
    return { imgWidth }
  },
  methods: {
    onListUpdate(newV: ImageShow[]) {
      console.log("onListUpdate..........")
      console.log(newV)
      console.log(" ")
      this.$emit("update:modelValue", newV)
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
    ghost-class="ghost"
    item-key="id"
  >
    <template #item="{ element }">
      <liu-img :src="element.src" :width="imgWidth" :height="imgWidth"
        class="cc-img"
        object-fit="cover"
      ></liu-img>
    </template>
  </DraggAble>

</template>
<style lang="scss">

.cc-container {
  display: flex;
  flex-wrap: wrap;
  flex: 1;

  .cc-img {
    width: v-bind("imgWidth + 'px'");
    height: v-bind("imgWidth + 'px'");
    overflow: hidden;
    border-radius: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
    cursor: move;
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