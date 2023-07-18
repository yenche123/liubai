<script setup lang="ts">
import { useVctTelegram } from "./tools/useVctTelegram"

const props = defineProps({
  link: {
    type: String
  },
})

const { boxRef } = useVctTelegram(props)

</script>
<template>


  <div class="vctt-box" ref="boxRef">
    
  </div>
  <div class="vctt-virtual"></div>

</template>
<style scoped lang="scss">

.vctt-box {
  width: 100%;
  height: auto;
  flex: none;
  position: relative;
}

.vctt-virtual {
  width: 100%;
  height: 50px;
  flex: none;
}


</style>