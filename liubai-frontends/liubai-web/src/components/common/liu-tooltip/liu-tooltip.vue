<script setup lang="ts">
import type { PropType } from 'vue';
import type { TooltipPlacement } from "./tools/types"

defineProps({
  ariaLabel: {
    type: String,
  },
  shortcut: {
    type: String,
  },
  placement: {
    type: String as PropType<TooltipPlacement>,
    default: "top"
  },
  strategy: {
    type: String as PropType<"absolute" | "fixed">,
    default: "absolute"
  },
  distance: {
    type: Number,
    default: 10
  },
  showDelay: {
    type: Number,
    default: 250
  }
})


</script>
<template>

  <VTooltip :placement="placement" 
    :strategy="strategy"
    :distance="distance"
    :delay="{ show: showDelay, hide: 0 }"
    theme="liu-tooltip"
  >

    <template #default>
      <slot></slot>
    </template>

    <template #popper>
      <div class="lt-container">
        <div class="liu-no-user-select lt-title">
          <span>{{ ariaLabel }}</span>
        </div>
        <div class="liu-no-user-select lt-content" v-if="shortcut">
          <span>{{ shortcut }}</span>
        </div>
      </div>
    </template>

  </VTooltip>

</template>
<style lang="scss" scoped>

.lt-container {
  position: relative;
}

.lt-title {
  color: var(--on-cui-loading);
  font-size: var(--mini-font);
}

.lt-content {
  color: var(--shortcut-text);
  font-size: var(--state-font);
}


</style>
<style lang="scss">

/** 覆盖原 floating-vue 的 css */
.v-popper--theme-liu-tooltip {

  .v-popper__inner {
    border-radius: 4px;
    background: var(--cui-loading);
    border: 0;
    box-shadow: var(--tooltip-shadow);
    padding: 5px 12px 4px;
  }

  .v-popper__arrow-container {
    display: none;
  }

}


</style>