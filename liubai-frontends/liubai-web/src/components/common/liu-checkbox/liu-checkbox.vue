<script setup lang="ts">

defineProps({
  checked: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 22,
  },
  borderSize: {
    type: Number,
    default: 3,
  },
  borderColor: {
    type: String,
    default: "var(--main-code)"
  },
  circleSize: {
    type: Number,
    default: 12,
  }
})

defineEmits<{
  (event: "tapcheckbox"): void
}>()

</script>
<template>

  <div class="liu-checkbox" @click="$emit('tapcheckbox')">
    <div class="liu-checked" v-show="checked"></div>
  </div>

</template>
<style lang="scss" scoped>

.liu-checkbox {
  width: v-bind("size + 'px'");
  height: v-bind("size + 'px'");
  border-radius: 50%;
  border: v-bind("borderSize + 'px'") solid v-bind("borderColor");
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  cursor: pointer;

  .liu-checked {
    width: v-bind("circleSize + 'px'");
    height: v-bind("circleSize + 'px'");
    border-radius: 50%;
    overflow: hidden;
    background: var(--checkbox-bg);
  }
}


</style>