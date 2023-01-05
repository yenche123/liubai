<script lang="ts">
import { defineComponent, PropType } from 'vue';
import PlaceholderView from '../../../views/common/placeholder-view/placeholder-view.vue';
import ThreadCard from "../thread-list/thread-card/thread-card.vue"
import { useThreadDetail } from "./tools/useThreadDetail"
import { useThreadOperateInDetail } from './tools/useThreadOperateInDetail';
import { subscribeUpdate } from "./tools/subscribeUpdate"
import type { WhatDetail } from '../../../types/other/types-custom';

export default defineComponent({

  components: {
    PlaceholderView,
    ThreadCard,
  },

  props: {
    location: {
      type: String as PropType<WhatDetail>,
      required: true
    }
  },

  setup(props) {
    const {
      tdData
    } = useThreadDetail(props)

    const {
      receiveOperation
    } = useThreadOperateInDetail(tdData)

    subscribeUpdate(tdData)

    return {
      tdData,
      receiveOperation
    }
  },
})


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