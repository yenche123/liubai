<script setup lang="ts">
import ThreadList from '~/components/level1/thread-list/thread-list.vue';

defineProps({
  tagId: String
})

const onNodata = () => {
  // console.log("该标签下没有动态")
}

const onHasdata = () => {
  // console.log("该标签下有动态.......")
}

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box">
      <thread-list v-if="tagId" 
        view-type="TAG"
        :tag-id="tagId"
        @nodata="onNodata"
        @hasdata="onHasdata"
      ></thread-list>
    </div>
  </div>

</template>
<style scoped>

</style>