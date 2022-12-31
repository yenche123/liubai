<script setup lang="ts">
import { PropType } from 'vue';
import PlaceholderView from '../../../views/common/placeholder-view/placeholder-view.vue';
import ThreadCard from "../thread-list/thread-card/thread-card.vue"
import { useThreadDetail } from "./tools/useThreadDetail"
import { useThreadOperateInDetail } from './tools/useThreadOperateInDetail';
import { subscribeUpdate } from "./tools/subscribeUpdate"

const props = defineProps({
  location: {
    type: String as PropType<"vice-view" | "detail-page">,
    required: true
  }
})

const {
  tdData
} = useThreadDetail(props)

const {
  receiveOperation
} = useThreadOperateInDetail(tdData)

subscribeUpdate(tdData)

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
    @newoperate="receiveOperation"
  ></ThreadCard>

</template>
<style scoped lang="scss">


</style>