<script setup lang="ts">
import { useVctGithubGist } from './tools/useVctGithubGist';

const props = defineProps({
  link: {
    type: String
  },
})

const { gistSrcDoc } = useVctGithubGist(props)

</script>
<template>


  <iframe v-if="gistSrcDoc" class="vctt-box" :srcdoc="gistSrcDoc"
    frameborder="0"
    framespacing="0"
  ></iframe>

</template>
<style scoped lang="scss">

.vctt-box {
  width: 100%;
  height: 100%;
  flex: none;
  position: relative;
  border: none;
}


</style>