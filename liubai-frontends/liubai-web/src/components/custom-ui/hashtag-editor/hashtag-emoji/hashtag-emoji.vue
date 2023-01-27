<script lang="ts" setup>

import { CUSTOM_EMOJIS } from "./tools/custom-emojis"

defineProps({
  hasEmoji: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (event: "emojichange", newEmoji?: string): void
}>()

const onTapEmoji = (emoji: string, hide: () => void) => {
  emit("emojichange", emoji)
  hide()
}

const onTapRemove = (hide: () => void) => {
  emit("emojichange")
  hide()
}

</script>
<template>
  <VDropdown 
    :hideTriggers="['click']"
    placement="bottom-start"
    theme="emoji-select"
  >

    <template #default>
      <slot></slot>
    </template>

    <template #popper="{ hide }">

      <div class="he-container">

        <div v-if="hasEmoji" class="he-first-bar">
          <CustomBtn type="other" size="mini" @click="onTapRemove(hide)">
            <span>移除</span>
          </CustomBtn>
        </div>

        <div class="he-box">

          <template v-for="(item, index) in CUSTOM_EMOJIS" :key="index">
        
            <div class="liu-hover he-item" @click="onTapEmoji(item, hide)">
              <span>{{ item }}</span>
            </div>

          </template>
        </div>
        
      </div>
    
    </template>


  </VDropdown>
  
</template>
<style lang="scss">

.he-container {
  overflow-y: auto;
  padding: 10px;
  width: 490px;
  max-height: 50vh;
  position: relative;
  scrollbar-color: var(--sidebar-scrollbar-thumb) transparent;

  &::-webkit-scrollbar-thumb {
    background: var(--sidebar-scrollbar-thumb);
  }

  .he-first-bar {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  .he-box {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
  }

  .he-item {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--head-font);
  }

}

@media screen and (max-width: 600px) {
  .he-container {
    width: 410px;
  }
}

@media screen and (max-width: 430px) {
  .he-container {
    width: 360px;

    .he-item {
      width: 70px;
      height: 70px;
    }
  }
}


@media screen and (max-width: 390px) {
  .he-container {
    width: 310px;
    padding: 0;

    .he-item {
      width: 60px;
      height: 60px;
    }
  }
}

@media screen and (max-width: 320px) {
  .he-container {
    width: 260px;

    .he-item {
      width: 50px;
      height: 50px;
      font-size: var(--title-font);
    }
  }
}

/** 覆盖原 floating-vue 的 css */
.v-popper--theme-emoji-select {

  .v-popper__inner {
    border-radius: 20px;
    background: var(--card-bg);
    border: 1px solid var(--line-default);
    box-shadow: var(--floating-shadow);
  }

  .v-popper__arrow-outer {
    visibility: hidden;
  }

  .v-popper__arrow-inner {
    border-color: var(--card-bg);
  }

}




</style>