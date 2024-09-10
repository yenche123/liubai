<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useNaviLink, type NaviLinkEmits } from "./tools/useNaviLink";
import liuApi from '~/utils/liu-api';

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  //@ts-ignore
  ...RouterLink.props,
})

const emit = defineEmits<NaviLinkEmits>()
const { href, onTapLink } = useNaviLink(props, emit)
const network = liuApi.network

</script>
<template>
  <router-link
    v-bind="$props"
    custom
    :to="props.to"
  >
    <a
      v-bind="$attrs"
      :href="href"
      @click.prevent="onTapLink"
      @mouseenter="network.prefetchLink"
    >
      <slot />
    </a>
  </router-link>
</template>