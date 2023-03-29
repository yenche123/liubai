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

  <div class="mc-container">
    <div class="tc-virtual"></div>
    <div class="mc-box">
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

.mc-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.tc-virtual {
  width: 100%;
  height: 10px;
}

.mc-box {
  width: 90%;
  max-width: var(--card-max);
  min-width: var(--card-min);
  position: relative;
}



</style>