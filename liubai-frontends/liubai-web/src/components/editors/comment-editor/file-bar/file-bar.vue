<script setup lang="ts">

defineProps({
  fileShowName: String
})

defineEmits<{
  (event: "tapclear"): void
}>()

</script>
<template>

  <div v-if="fileShowName" class="file-bar">
    <div class="fb-icon">
      <svg-icon class="fb-svg" name="attachment" color="var(--other-btn-text)"></svg-icon>
    </div>
    <div class="fb-text">
      <span>{{ fileShowName }}</span>
    </div>
  </div>

</template>
<style scoped lang="scss">

.file-bar {
  display: flex;
  width: 100%;
  position: relative;
}

.fb-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-end: 4px;
  flex: none;
}

.fb-svg {
  width: 22px;
  height: 22px;
}

.fb-text {
  flex: 1;
  font-size: var(--btn-font);
  line-height: 32px;
  user-select: none;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--primary-color);
}


</style>