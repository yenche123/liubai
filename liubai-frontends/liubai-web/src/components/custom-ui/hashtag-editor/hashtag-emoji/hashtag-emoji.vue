<script lang="ts" setup>

import { useI18n } from "vue-i18n";
import { CUSTOM_EMOJIS } from "./tools/custom-emojis"
import type { SimpleFunc } from "~/utils/basic/type-tool";

defineProps({
  hasEmoji: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (event: "emojichange", newEmoji?: string): void
}>()

const onTapEmoji = (emoji: string, hide: SimpleFunc) => {
  emit("emojichange", emoji)
  hide()
}

const onTapRemove = (hide: SimpleFunc) => {
  emit("emojichange")
  hide()
}

const { t } = useI18n()

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
            <span>{{ t('common.remove') }}</span>
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
  padding-inline-end: 0;
  width: 496px;
  max-height: 50vh;
  position: relative;
  scrollbar-color: var(--sidebar-scrollbar-thumb) transparent;

  &::-webkit-scrollbar-thumb {
    background: var(--sidebar-scrollbar-thumb);
  }

  .he-first-bar {
    width: calc(100% - 10px);
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
    width: 416px;
  }
}

@media screen and (max-width: 470px) {
  .he-container {
    width: 366px;

    .he-item {
      width: 70px;
      height: 70px;
    }
  }
}


@media screen and (max-width: 420px) {
  .he-container {
    width: 316px;
    padding: 10px 0;

    .he-item {
      width: 60px;
      height: 60px;
    }
  }
}

@media screen and (max-width: 360px) {
  .he-container {
    width: 266px;

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