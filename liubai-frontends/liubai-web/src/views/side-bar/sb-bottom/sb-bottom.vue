<script setup lang="ts">
import { useI18n } from "vue-i18n"

defineEmits<{
  (event: "tapclose"): void
}>()

defineProps({
  showHandle: {
    type: Boolean,
  },
})

const { t } = useI18n()
const color = "var(--main-note)"

</script>
<template>

  <div class="sb-bottom">

    <div class="sbb-main">

    </div>
    <div class="liu-hover sbb-close"
      @click="$emit('tapclose')"
      :aria-label="t('dnd.collapse')"
    >
      <svg-icon 
        class="sbb-close-svg" 
        name="triangle_open" 
        :color="color"
      ></svg-icon>
    </div>

  </div>


</template>
<style lang="scss" scoped>

.liu-hover::before {
  border-radius: 0;
}

.sb-bottom {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 9px;
  display: flex;
  pointer-events: none;
}

.sbb-main {
  flex: 1;
}

.sbb-close {
  pointer-events: auto;
  width: 14px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-top-left-radius: 9px;
  border-bottom-left-radius: 9px;
  border: 0.6px solid var(--line-default);
  border-right: 0;
  background-color: var(--bg-color);
  transition: .15s;
  transform-origin: center right;
  opacity: v-bind("showHandle ? '1' : '0'");
  position: relative;

  .sbb-close-svg {
    width: 9px;
    height: 9px;
    transform: rotate(180deg);
  }
}


@media(hover: hover) {
  .sbb-close:hover {
    transform: scale(1.25);
  }

  .liu-hover:hover::before {
    opacity: 0;
  }

  .liu-hover[aria-label]::after {
    top: 0;
    right: 100%;
    transform: translateX(-3%) scale(0.8);
  }
}

.liu-hover:active::before {
  opacity: 0;
}


</style>