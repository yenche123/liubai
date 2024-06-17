<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { A2hsTipProps, A2hsTipEmits } from "./tools/types"
import { useA2hsTip } from "./tools/useA2hsTip"

const props = defineProps<A2hsTipProps>()
defineEmits<A2hsTipEmits>()

const { atData } = useA2hsTip(props)
const { t } = useI18n()

const icon_color = `var(--main-code)`

</script>
<template>

  <div v-if="atData.enable" class="a2hs-container"
    :class="{ 'a2hs-container_show': atData.show }"
  >
    <div class="liu-highlight-box a2hs-box"
      :class="{ 'a2hs-box_show': atData.show }"
    >
      <div class="a2hs-first-bar">
        <span>{{ t('a2hs.title') }}</span>
        <div class="a2hsf-footer">
          <div class="a2hs-close-box" @click.stop="$emit('tapclose')">
            <svg-icon name="close" class="a2hs-close-svg"
              :color="icon_color"
            ></svg-icon>
          </div>
        </div>
      </div>
      <div class="a2hs-desc">
        <span>{{ t('a2hs.desc') }}</span>
      </div>
      <div class="a2hs-btn-bar">
        <custom-btn type="main" size="mini" @click="$emit('tapinstall')">
          <span class="a2hs-btn_span">{{ t('a2hs.add') }}</span>
        </custom-btn>
      </div>
    </div>
  </div>

</template>
<style lang="scss" scoped>

.a2hs-container {
  width: 100%;
  max-height: 0;
  overflow: hidden;
  transition: .3s;
}

.a2hs-container_show {
  max-height: 200px;
}

.a2hs-box {
  transition: .3s;
  opacity: 0;
}

.a2hs-box_show {
  opacity: 1;
}

.a2hs-first-bar {
  display: flex;
  align-items: flex-start;
  flex: 1;
  font-size: var(--title-font);
  font-weight: 700;
}

.a2hsf-footer {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.a2hs-close-box {
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  margin-block-start: -6px;
  margin-inline-end: -6px;
  transition: .15s;
  cursor: pointer;
}

.a2hs-close-svg {
  width: 24px;
  height: 24px;
}

.a2hs-desc {
  margin-block-end: 16px;
}

.a2hs-btn-bar {
  display: flex;
}

.a2hs-btn_span {
  font-weight: 700;
}

@media(hover: hover) {
  .a2hs-close-box:hover {
    opacity: .7;
  }
}


</style>