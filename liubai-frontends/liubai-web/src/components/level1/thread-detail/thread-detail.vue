<script setup lang="ts">
import { PropType } from 'vue';
import PlaceholderView from '../../../views/common/placeholder-view/placeholder-view.vue';
import ThreadCard from "../thread-list/thread-card/thread-card.vue"
import { useThreadDetail } from "./tools/useThreadDetail"

const props = defineProps({
  location: {
    type: String as PropType<"vice-view" | "detail-page">,
    required: true
  }
})

const {
  tdData
} = useThreadDetail(props)

</script>
<template>

  <PlaceholderView 
    :p-state="tdData.state"
  ></PlaceholderView>
  <ThreadCard 
    v-if="tdData.threadShow && tdData.state < 0"
    :thread-data="tdData.threadShow"
    display-type="detail"
    :position="0"
  ></ThreadCard>

</template>
<style scoped lang="scss">


</style>