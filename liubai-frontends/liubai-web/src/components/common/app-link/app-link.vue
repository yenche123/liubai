<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAppLink } from "./tools/useAppLink";

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  //@ts-ignore
  ...RouterLink.props,
  inactiveClass: String,
})

const {
  isExternalLink,
  href,
  isActive,
  isExactActive,
  onTapLink,
} = useAppLink(props)

</script>

<template>
  <a v-if="isExternalLink" v-bind="$attrs" :href="props.to" target="_blank">
    <slot />
  </a>
  <router-link
    v-else
    v-bind="$props"
    custom
    :to="props.to"
  >
    <a
      v-bind="$attrs"
      :href="href"
      @click.prevent="onTapLink"
      :class="isActive ? props.activeClass : props.inactiveClass"
    >
      <slot />
    </a>
  </router-link>
</template>