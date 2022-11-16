<script setup lang="ts">
import { useThreadList } from './tools/useThreadList';

const props = defineProps({
  viewType: {
    type: String,
    default: "",      // 默认为空，表示不区分
  }
})

const {
  list
} = useThreadList(props)

</script>
<template>
  <div class="tl-test">
    测试中
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