<script lang="ts">
import { RouterLink } from 'vue-router'
import { useNaviLink } from "./tools/useNaviLink";
import type { ToRoute } from "~/types";

export default {
  name: "NaviLink",
  inheritAttrs: false,

  props: {
    //@ts-ignore
    ...RouterLink.props,
  },

  emits: {
    aftertap: (toRoute: ToRoute) => true,
  },

  setup(props: any, { emit }) {
    const {
      href,
      onTapLink,
    } = useNaviLink(props, emit)

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
      @click.prevent="onTapLink"
    >
      <slot />
    </a>
  </router-link>
</template>