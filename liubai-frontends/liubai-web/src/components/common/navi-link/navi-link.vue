<script lang="ts">
import { RouterLink } from 'vue-router'
import { useNaviLink } from "./tools/useNaviLink";

export default {
  name: "NaviLink",
  inheritAttrs: false,

  props: {
    //@ts-ignore
    ...RouterLink.props,
  },

  setup(props: any, context: any) {
    const {
      href,
      onTapLink,
    } = useNaviLink(props)

    return { href, onTapLink }
  }
}

</script>
<template>
  <router-link
    v-bind="$props"
    custom
    :to="to"
  >
    <a
      v-bind="$attrs"
      :href="href"
      @click="onTapLink"
    >
      <slot />
    </a>
  </router-link>
</template>