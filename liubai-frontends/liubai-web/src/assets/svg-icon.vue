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
  }
})
const symbolId = computed(() => {
  return `#${props.prefix}-${props.name}`
})

</script>
<template>
  <svg aria-hidden="true" class="svg-icon">
    <use :xlink:href="symbolId" 
      :fill="color ? color : undefined" 
      :stroke="color ? color : undefined" 
    />
  </svg>
</template>
<style scoped>

.svg-icon {
  fill: var(--main-text);
  stroke: var(--main-text);
}

</style>