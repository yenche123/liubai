<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  prefix: {
    type: String,
    default: "icon",
  },
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "",
  },
  coverFillStroke: {
    type: Boolean,
    default: true
  },
  disableStroke: {
    type: Boolean,
    default: false
  },
})
const symbolId = computed(() => {
  return `#${props.prefix}-${props.name}`
})

</script>
<template>
  <svg aria-hidden="true" :class="{ 
    'svg-icon': coverFillStroke,
    'svg-icon_stroke': coverFillStroke && !disableStroke,
  }">
    <use :xlink:href="symbolId" 
      :fill="color ? color : undefined" 
      :stroke="disableStroke ? undefined : (color ? color : undefined)" 
    />
  </svg>
</template>
<style scoped>

.svg-icon {
  fill: var(--main-text);
}

.svg-icon_stroke {
  stroke: var(--main-text);
}

</style>