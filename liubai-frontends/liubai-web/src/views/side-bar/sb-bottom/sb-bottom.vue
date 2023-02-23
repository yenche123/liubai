<script setup lang="ts">

defineEmits<{
  (event: "tapclose"): void
}>()

defineProps({
  showHandle: {
    type: Boolean,
  },
})

const color = "var(--navi-normal)"

</script>
<template>

  <div class="liu-frosted-glass sb-bottom">

    <div class="sbb-main">

    </div>
    <div class="liu-hover sbb-close"
      @click="$emit('tapclose')"
    >
      <svg-icon 
        class="sbb-close-svg" 
        name="double-arrow-left" 
        :color="color"
      ></svg-icon>
    </div>

  </div>


</template>
<style lang="scss" scoped>

.liu-frosted-glass::before {
  background: none;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.sb-bottom {
  padding-block-end: 8px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 14px;
  display: flex;
}

.sbb-main {
  flex: 1;
}

.sbb-close {
  width: 40px;
  height: 40px;
  margin-inline-end: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: .15s;
  opacity: v-bind("showHandle ? '1' : '0'");

  .sbb-close-svg {
    width: 30px;
    height: 30px;
  }
}



</style>