<script setup lang="ts">
// 在左下角的 "打开侧边栏" 的按钮

import { useI18n } from 'vue-i18n';
import { useSbOpen } from './tools/useSbOpen';
import liuUtil from '~/utils/liu-util';

defineEmits<{
  (event: "tapopen"): void
}>()

const {
  show
} = useSbOpen()

const { t } = useI18n()

const shortcut = `${liuUtil.getHelpTip('Mod')} + \\`

</script>
<template>

  <div class="sbo-container">
    <LiuTooltip placement="right" 
      strategy="fixed"
      :aria-label="t('dnd.sidebar')"
      :shortcut="shortcut"
    >
      <div class="liu-hover sb-open"
        @click="$emit('tapopen')"
      >
        <svg-icon
          name="triangle_open"
          color="var(--main-note)"
          class="sb-open-svg"
        ></svg-icon>
      </div>
    </LiuTooltip>
  </div>

</template>
<style lang="scss" scoped>

.sbo-container {
  width: 16px;
  height: 44px;
  position: fixed;
  left: 0;
  bottom: 30px;
  z-index: 300;
  visibility: v-bind("show ? 'visible' : 'hidden'");
}

.sb-open {
  width: 14px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-top-right-radius: 9px;
  border-bottom-right-radius: 9px;
  border: 0.6px solid var(--sidebar-scrollbar-thumb);
  border-left: 0;
  background-color: var(--sidebar-bg);
  transition: .15s;
  transform-origin: center left;
  will-change: transform;
 
  .sb-open-svg {
    position: relative;
    width: 9px;
    height: 9px;
  }
}

.liu-hover::before {
  border-radius: 0;
}


@media(hover: hover) {
  .sb-open:hover {
    transform: scale(1.25);
  }

  .liu-hover:hover::before {
    opacity: 0;
  }

  .liu-hover[aria-label]::after {
    top: 0;
    right: 0;
    transform: translateX(100%) scale(0.8);
  }
}

.liu-hover:active::before {
  opacity: 0;
}



</style>