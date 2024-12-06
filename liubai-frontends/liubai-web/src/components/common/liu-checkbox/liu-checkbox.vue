<script setup lang="ts">

const props = defineProps({
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
  checkedColor: {
    type: String,
    default: "var(--checkbox-bg)"
  },
  circleSize: {
    type: Number,
    default: 12,
  },
  disabled: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits<{
  (event: "tapcheckbox"): void
}>()

const onTapCheckbox = () => {
  if (!props.disabled) {
    emit("tapcheckbox")
  }
}

</script>
<template>

  <div class="liu-checkbox" @click="onTapCheckbox">
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
  cursor: v-bind("disabled ? 'inherit' : 'pointer'");

  .liu-checked {
    width: v-bind("circleSize + 'px'");
    height: v-bind("circleSize + 'px'");
    border-radius: 50%;
    overflow: hidden;
    background: v-bind("checkedColor");
  }
}


</style>