<script setup lang="ts">
import { useThreadList } from './tools/useThreadList';
import ThreadCard from './thread-card/thread-card.vue';

const props = defineProps({
  viewType: {
    type: String,
    default: "",      // "": 默认; "TRASH": 回收站; "TAG": 标签; "FAVORITE": 收藏;
  },
  tagId: {
    type: String,
    default: "",
  }
})

const {
  list
} = useThreadList(props)

</script>
<template>
  <div class="tl-container">

    <template v-for="(item, index) in list">
      
      <ThreadCard 
        :thread-data="item"
      ></ThreadCard>
    
    </template>

  </div>
</template>
<style lang="scss">

.tl-test {
  width: 100%;
  text-align: center;
  font-size: 17px;
  color: var(--main-text);
}


</style>