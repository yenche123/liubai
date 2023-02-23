<script setup lang="ts">
// 在左下角的 "打开侧边栏" 的按钮

import { useSbOpen } from './tools/useSbOpen';

defineEmits<{
  (event: "tapopen"): void
}>()

const {
  show
} = useSbOpen()


</script>
<template>

  <div class="sb-open"
    @click="$emit('tapopen')"
  >
    <svg-icon
      name="triangle_open"
      color="var(--main-note)"
      class="sb-open-svg"
    ></svg-icon>
  </div>

</template>
<style lang="scss" scoped>


.sb-open {
  width: 14px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  left: 0;
  bottom: 30px;
  z-index: 300;
  overflow: hidden;
  cursor: pointer;
  border-top-right-radius: 9px;
  border-bottom-right-radius: 9px;
  border: 0.6px solid var(--sidebar-scrollbar-thumb);
  background-color: var(--sidebar-bg);
  transition: .15s;
  transform-origin: center left;
  visibility: v-bind("show ? 'visible' : 'hidden'");
 

  .sb-open-svg {
    position: relative;
    width: 9px;
    height: 9px;
  }
}

@media(hover: hover) {
  .sb-open:hover {
    transform: scale(1.25);
  }

}



</style>