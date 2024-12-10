<script lang="ts" setup>
import { copyButtonProps } from "./tools/types"
import { useCopyButton } from "./tools/useCopyButton";

const props = defineProps(copyButtonProps)
const { onTapCopyButton } = useCopyButton(props)

</script>
<template>

  <button @click="onTapCopyButton"
    class="liu-copy-button"
  >{{ props.textToShow }}</button>

</template>
<style scoped>

.liu-copy-button {
  padding: 0 20px;
  line-height: 38px;
  font-size: 14px;
  border-color: var(--vp-button-brand-border);
  background-color: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}

@media(hover: hover) {
  .liu-copy-button:hover {
    border-color: var(--vp-button-brand-hover-border);
    color: var(--vp-button-brand-hover-text);
    background-color: var(--vp-button-brand-hover-bg);
  }
}

</style>