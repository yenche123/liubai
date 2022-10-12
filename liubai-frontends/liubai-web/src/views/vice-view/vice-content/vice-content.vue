<script setup lang="ts">

const props = defineProps({
  isOutterDraging: {
    type: Boolean,
    default: false
  }
})

</script>
<template>
  <iframe width="100%" height="315" src="https://www.youtube.com/embed/1dudOwY9Jp4" title="YouTube video player"
    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
  <div v-if="isOutterDraging" class="vc-cover"></div>

</template>
<style scoped>

.vc-cover {
  width: 100%;
  height: 315px;
  margin-top: -315px;
  background-color: aliceblue;
  opacity: 0.5;
}

</style>