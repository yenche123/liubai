<script lang="ts" setup>

defineProps({
  color: {
    type: String,
    default: "var(--primary-hover)",
  }
})

</script>
<template>
  <div class="pulsar"></div>
</template>
<style scoped>

.pulsar {
  --uib-size: 40px;
  --uib-speed: 1.5s;
  position: relative;
  height: var(--uib-size);
  width: var(--uib-size);
}

.pulsar::before,
.pulsar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  border-radius: 50%;
  background-color: v-bind("color");
  animation: pulse var(--uib-speed) ease-in-out infinite;
  transform: scale(0);
}

.pulsar::after {
  animation-delay: calc(var(--uib-speed) / -2);
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(1);
    opacity: 0.25;
  }
}

</style>