<script setup lang="ts">
import type { PropType } from "vue";
import type { CcReactionItem } from "../tools/types"

defineProps({
  reactions: {
    type: Array as PropType<CcReactionItem[]>,
  }
})

defineEmits<{
  (evt: "tapreaction", encodeStr: string, chosen: boolean): void
}>()

</script>
<template>

  <div class="cc-reactions" v-if="reactions?.length">

    <template v-for="(item, index) in reactions" :key="item.emojiEncoded">
      <div class="ccr-item" 
        :class="{ 'ccr-item_selected': item.chosen }"
        @click.stop="$emit('tapreaction', item.emojiEncoded, item.chosen)"
      >

        <div class="ccri-icon-box">

          <svg-icon v-if="item.iconName" :name="item.iconName"
            :coverFillStroke="false"
            class="ccri-svg"
          ></svg-icon>

          <span v-else>{{ item.emoji }}</span>

        </div>

        <span class="ccri-text">{{ item.num }}</span>

      </div>
    </template>

  </div>


</template>
<style lang="scss" scoped>

.cc-reactions {
  width: 100%;
  position: relative;
  display: flex;
  flex-wrap: wrap;
  padding-block-start: 8px;
  padding-block-end: 4px;
}

.ccr-item {
  display: flex;
  align-items: center;
  border-radius: 20px;
  position: relative;
  padding: 2px 10px 2px 8px;
  margin-inline-end: 6px;
  margin-block-end: 6px;
  font-size: var(--state-font);
  color: var(--main-normal);
  font-weight: 700;
  overflow: hidden;
  user-select: none;
  cursor: pointer;
  transition: .15s;

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    content: "";
    width: 100%;
    height: 100%;
    opacity: .11;
    background-color: var(--primary-color);
  }
}

.ccr-item_selected {
  color: var(--always-a2);

  &::before {
    opacity: 1;
    background: var(--always-a1);
  }
}

.ccri-icon-box {
  width: 26px;
  height: 26px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--inline-code-font);
  margin-inline-end: 3px;

  .ccri-svg {
    width: 20px;
    height: 20px;
  }
}

.ccri-text {
  position: relative;
  display: flex;
  min-width: 14px;
  justify-content: center;
}

@media(hover: hover) {

  .ccr-item:hover {
    opacity: .75;
  }

}


</style>