<script setup lang="ts">

defineProps({
  color: {
    type: String,
    default: "var(--primary-hover)",
  },
  size: {
    type: Number,
    default: 40,
  }
})

</script>
<template>

<svg
  class="container"
  viewBox="0 0 40 40"
  :height="size"
  :width="size"
>
  <circle 
    class="track"
    cx="20" 
    cy="20" 
    r="17.5" 
    pathlength="100" 
    stroke-width="5px" 
    fill="none" 
  />
  <circle 
    class="car"
    cx="20" 
    cy="20" 
    r="17.5" 
    pathlength="100" 
    stroke-width="5px" 
    fill="none" 
  />
</svg>

</template>
<style scoped>

.container {
  --uib-size: v-bind("size + 'px'");
  --uib-color: v-bind("color");
  --uib-speed: 2s;
  --uib-bg-opacity: 0;
  height: var(--uib-size);
  width: var(--uib-size);
  transform-origin: center;
  animation: rotate var(--uib-speed) linear infinite;
  will-change: transform;
  overflow: visible;
}

.car {
  fill: none;
  stroke: var(--uib-color);
  stroke-dasharray: 1, 200;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: stretch calc(var(--uib-speed) * 0.75) ease-in-out infinite;
  will-change: stroke-dasharray, stroke-dashoffset;
  transition: stroke 0.5s ease;
}

.track {
  fill: none;
  stroke: var(--uib-color);
  opacity: var(--uib-bg-opacity);
  transition: stroke 0.5s ease;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes stretch {
  0% {
    stroke-dasharray: 0, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 75, 150;
    stroke-dashoffset: -25;
  }
  100% {
    stroke-dashoffset: -100;
  }
}

</style>