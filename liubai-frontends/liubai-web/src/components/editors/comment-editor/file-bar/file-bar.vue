<script setup lang="ts">
import type { MenuItem } from "~/components/common/liu-menu/tools/types"

defineProps({
  fileShowName: String
})

const emit = defineEmits<{
  (evt: "tapviewfile"): void
  (event: "tapclear"): void
}>()

const menu = [
  {
    text_key: "common.view",
  },
  {
    text_key: "common.remove"
  }
]

const onTapWhenItem = (item: MenuItem, index: number) => {
  if(index === 0) emit("tapviewfile")
  else if(index === 1) emit("tapclear")
}

</script>
<template>

  <div v-if="fileShowName" class="file-bar">
    <div class="fb-icon">
      <svg-icon class="fb-svg" name="attachment" color="var(--other-btn-text)"></svg-icon>
    </div>

    <div class="fb-desc">
      <LiuMenu
        :menu="menu"
        @tapitem="onTapWhenItem"
        min-width-str="70px"
        mask-z-index="2600"
      >
        <div class="liu-no-user-select fb-text">
          <span>{{ fileShowName }}</span>
        </div>
      </LiuMenu>
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
  margin-inline-start: -4px;
  margin-inline-end: 4px;
  flex: none;
}

.fb-svg {
  width: 22px;
  height: 22px;
}

.fb-desc {
  flex: 1;
  display: flex;
  max-width: calc(100% - 32px);
  overflow: hidden;
  position: relative;
}

.fb-text {
  width: 100%;
  position: relative;
  font-size: var(--btn-font);
  line-height: 32px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--primary-color);
  cursor: pointer;
}


@media(hover: hover) {

  .fb-text:hover {
    text-decoration: underline;
  }

}


</style>